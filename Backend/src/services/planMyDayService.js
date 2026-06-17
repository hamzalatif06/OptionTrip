/**
 * Plan My Day Service
 * Generates an AI-powered single-day itinerary anchored to the user's
 * current city. Includes live weather (Open-Meteo, no API key required)
 * and a structured timeline of activities with food picks, tips, and
 * realistic costs.
 */

import OpenAI from 'openai';

let openai = null;
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

// ─── Weather (Open-Meteo — free, no API key) ────────────────────────────────

/**
 * Map Open-Meteo weather codes → human label + emoji.
 * https://open-meteo.com/en/docs#weathervariables
 */
const weatherCodeMap = {
  0:  { label: 'Clear sky',          emoji: '☀️' },
  1:  { label: 'Mostly clear',       emoji: '🌤️' },
  2:  { label: 'Partly cloudy',      emoji: '⛅' },
  3:  { label: 'Overcast',           emoji: '☁️' },
  45: { label: 'Foggy',              emoji: '🌫️' },
  48: { label: 'Rime fog',           emoji: '🌫️' },
  51: { label: 'Light drizzle',      emoji: '🌦️' },
  53: { label: 'Drizzle',            emoji: '🌦️' },
  55: { label: 'Heavy drizzle',      emoji: '🌧️' },
  61: { label: 'Light rain',         emoji: '🌧️' },
  63: { label: 'Rain',               emoji: '🌧️' },
  65: { label: 'Heavy rain',         emoji: '⛈️' },
  71: { label: 'Light snow',         emoji: '🌨️' },
  73: { label: 'Snow',               emoji: '🌨️' },
  75: { label: 'Heavy snow',         emoji: '❄️' },
  77: { label: 'Snow grains',        emoji: '🌨️' },
  80: { label: 'Light showers',      emoji: '🌦️' },
  81: { label: 'Showers',            emoji: '🌧️' },
  82: { label: 'Heavy showers',      emoji: '⛈️' },
  85: { label: 'Snow showers',       emoji: '🌨️' },
  86: { label: 'Heavy snow showers', emoji: '❄️' },
  95: { label: 'Thunderstorm',       emoji: '⛈️' },
  96: { label: 'Thunderstorm + hail',emoji: '⛈️' },
  99: { label: 'Severe thunderstorm',emoji: '⛈️' }
};

const fetchWeather = async (lat, lng, dateISO) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&current_weather=true` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset,precipitation_probability_max` +
      `&timezone=auto` +
      (dateISO ? `&start_date=${dateISO}&end_date=${dateISO}` : '');
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();

    const cw      = j.current_weather || {};
    const daily   = j.daily || {};
    const code    = (daily.weathercode?.[0] ?? cw.weathercode) ?? 0;
    const codeMap = weatherCodeMap[code] || { label: 'Unknown', emoji: '🌡️' };

    return {
      label: codeMap.label,
      emoji: codeMap.emoji,
      code,
      temp_now_c:  typeof cw.temperature === 'number' ? cw.temperature : null,
      temp_max_c:  daily.temperature_2m_max?.[0] ?? null,
      temp_min_c:  daily.temperature_2m_min?.[0] ?? null,
      precip_prob: daily.precipitation_probability_max?.[0] ?? null,
      sunrise:     daily.sunrise?.[0] || null,
      sunset:      daily.sunset?.[0]  || null,
      windspeed:   cw.windspeed ?? null
    };
  } catch (err) {
    console.warn('Open-Meteo weather fetch failed:', err.message);
    return null;
  }
};

// ─── Prompt builders ────────────────────────────────────────────────────────

const PROMPT_VIBES = {
  foodie:    'a food-led day — coffee, brunch, bakery, lunch, dessert, dinner; treat the city like a tasting menu',
  cultural:  'a culture-rich day — museums, historic neighborhoods, architecture, local craft, slow café breaks',
  adventure: 'an active outdoors day — hikes, viewpoints, water, biking, sport, energy',
  relaxed:   'a slow, low-effort day — parks, cafés, easy strolls, low-pressure pacing',
  romantic:  'a romantic day — scenic spots, intimate restaurants, golden-hour viewpoints, atmospheric venues',
  family:    'a family-friendly day — kid-engaging activities, easy food, parks, low walking distances',
  local:     'a like-a-local day — neighborhood spots only locals visit, no tourist traps',
  nightlife: 'an evening- and night-focused day — late lunch, sunset spot, dinner, drinks, late bites',
  workcafe:  'a digital-nomad work day — laptop-friendly cafés, lunch break, short evening reward'
};

const PROMPT_BUDGETS = {
  budget:   'thrifty (under ~$20-30 per meal, free attractions where possible)',
  moderate: 'mid-range (~$30-60 per meal, mix of paid + free attractions)',
  premium:  'premium (fine dining, paid attractions OK, comfort prioritized)',
  luxury:   'no expense spared — Michelin, top experiences, private guides if useful'
};

const buildSystemPrompt = ({ location, dateISO, startTime, durationHours, vibe, budget, interests, partySize, weather }) => {
  const place = `${location.city || 'the area'}${location.country ? `, ${location.country}` : ''}`;
  const vibeDesc   = PROMPT_VIBES[vibe]   || PROMPT_VIBES.local;
  const budgetDesc = PROMPT_BUDGETS[budget] || PROMPT_BUDGETS.moderate;

  let weatherBlock = '';
  if (weather) {
    weatherBlock =
      `\nLIVE WEATHER for that day:\n` +
      `- Conditions: ${weather.label}\n` +
      `- Temperature: high ${weather.temp_max_c}°C / low ${weather.temp_min_c}°C` +
        (typeof weather.temp_now_c === 'number' ? ` (now ${weather.temp_now_c}°C)` : '') + `\n` +
      (weather.precip_prob != null ? `- Rain chance: ${weather.precip_prob}%\n` : '') +
      (weather.sunrise && weather.sunset ? `- Sunrise ${weather.sunrise.slice(11,16)} · Sunset ${weather.sunset.slice(11,16)}\n` : '') +
      `\nLet the weather shape choices: pick indoor venues if it's rainy/cold; lean to outdoor when it's mild & dry; nail the sunset spot if there's one worth it.`;
  }

  return `You are a savvy local concierge who plans real, walkable, time-aware days in cities for travelers and residents.

REQUEST
- Place: ${place}${location.neighborhood ? ` (near ${location.neighborhood})` : ''}
- Date: ${dateISO}${getDayOfWeek(dateISO) ? ` (${getDayOfWeek(dateISO)})` : ''}
- Window: starts at ${startTime}, lasts about ${durationHours} hours
- Vibe: ${vibe} — ${vibeDesc}
- Budget: ${budgetDesc}
- Party: ${partySize || 1} ${partySize > 1 ? 'people' : 'person'}
- Interests: ${interests?.length ? interests.join(', ') : 'general'}
${weatherBlock}

PLANNING RULES
- Use REAL places in ${place} — neighborhood, café, restaurant, park, museum, bar names that genuinely exist in that city. NEVER invent fake businesses.
- Cluster stops geographically — minimize zigzagging across the city.
- Respect opening rhythm: no brunch spots at 8pm, no nightclubs at 11am, no museums on their typical closed day. Many museums close Monday or Tuesday in Europe.
- Include real food picks for the meals that fit the window (e.g. breakfast/brunch, lunch, café, dinner) tied to the vibe and budget.
- Pace: 4-7 activities for a 6-10h day, 3-4 for a half day (under 5h), 2-3 for an evening.
- Cost estimates should be realistic per-person in the local currency.
- Tone: confident, specific, warm. "Walk 8 minutes north to Le Pain Quotidien for a slow brunch." Not: "You could maybe consider…"
- Skip generic clichés ("explore the local culture"). Be concrete.

OUTPUT — return ONLY valid JSON, no surrounding prose, in this exact shape:
{
  "summary": "<1-2 sentence overview of the day>",
  "vibe_label": "<short label e.g. 'Slow Foodie Sunday'>",
  "pace": "relaxed" | "moderate" | "packed",
  "currency": "<ISO code: USD|EUR|GBP|JPY|...>",
  "estimated_total_cost": <number, per person>,
  "weather_advice": "<1 sentence weather-tailored advice (e.g. 'Bring a light layer; rain expected after 4pm — book a museum slot then')>",
  "activities": [
    {
      "time": "HH:MM",
      "duration_minutes": <int>,
      "category": "breakfast" | "brunch" | "cafe" | "coffee" | "lunch" | "snack" | "dinner" | "drinks" | "sightseeing" | "museum" | "park" | "viewpoint" | "shopping" | "activity" | "walk" | "nightlife" | "wellness" | "local",
      "title": "<concrete venue or activity name>",
      "neighborhood": "<area name>",
      "address": "<street + neighborhood + city — full enough that Google Maps finds it on first try. If you're not 100% sure of the street, give 'Venue Name, Neighborhood, City' instead. Never invent an address you don't know.>",
      "coordinates": { "lat": <number>, "lng": <number> },
      "description": "<2-3 sentences: what they'll experience>",
      "why": "<1 sentence: why this specifically, not somewhere else>",
      "cost_estimate": <number, per person; 0 if free>,
      "tip": "<optional short pro-tip; can be omitted>",
      "tags": ["<2-4 short tags>"]
    }
  ],
  "food_picks": [
    {
      "name": "<restaurant>",
      "meal": "lunch" | "dinner" | "brunch" | "snack" | "coffee",
      "neighborhood": "<area>",
      "address": "<full address as above, or 'Name, Neighborhood, City' if unsure>",
      "coordinates": { "lat": <number>, "lng": <number> },
      "why": "<one line>",
      "price_tier": "$" | "$$" | "$$$" | "$$$$"
    }
  ],
  "tips": ["<3-5 short, practical pro tips for this exact day & place>"],
  "transport_advice": "<1-2 sentences: best way to move around given the route>",
  "rainy_plan": "<1 sentence: 'If it pours, swap X for Y' — concrete swap>"
}

COORDINATE RULES
- Coordinates are OPTIONAL. Only include the "coordinates" key when you are highly confident in the venue's real location. If unsure, OMIT the key entirely — do not guess. A wrong coordinate sends the user to the wrong place, which is worse than no coordinate.
- The "address" field, on the other hand, should always be present. It can be a precise street address or just "Venue Name, Neighborhood, City". Google Maps can resolve either.`;
};

const getDayOfWeek = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  } catch { return null; }
};

// ─── Main generator ─────────────────────────────────────────────────────────

export const generateDayPlan = async (params) => {
  const {
    location,
    dateISO,
    startTime    = '10:00',
    durationHours = 8,
    vibe         = 'local',
    budget       = 'moderate',
    interests    = [],
    partySize    = 1
  } = params || {};

  if (!location?.city && !(typeof location?.lat === 'number' && typeof location?.lng === 'number')) {
    throw new Error('Location (city or coords) required');
  }

  // Live weather in parallel with OpenAI call setup.
  const weatherPromise = fetchWeather(location.lat, location.lng, dateISO);

  const client = getOpenAIClient();
  if (!client) {
    return generateFallbackPlan({ location, dateISO, vibe, await: weatherPromise });
  }

  const weather = await weatherPromise;
  const systemPrompt = buildSystemPrompt({
    location, dateISO, startTime, durationHours, vibe, budget, interests, partySize, weather
  });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: 'Plan my day. Return only the JSON.' }
      ],
      temperature: 0.8,
      max_tokens: 1800,
      response_format: { type: 'json_object' }
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      return generateFallbackPlan({ location, dateISO, vibe, weather });
    }

    return {
      success: true,
      data: {
        ...parsed,
        weather,
        location: {
          city:         location.city || null,
          country:      location.country || null,
          neighborhood: location.neighborhood || null,
          lat:          location.lat || null,
          lng:          location.lng || null
        },
        date:        dateISO,
        start_time:  startTime,
        duration_h:  durationHours,
        generated_at: new Date().toISOString()
      }
    };
  } catch (err) {
    console.error('Plan My Day OpenAI error:', err);
    return generateFallbackPlan({ location, dateISO, vibe, weather });
  }
};

// ─── Fallback ───────────────────────────────────────────────────────────────

const generateFallbackPlan = async ({ location, dateISO, vibe, weather, await: weatherPromise }) => {
  const w = weather ?? (await (weatherPromise || Promise.resolve(null)));
  const place = location.city || 'your area';
  return {
    success: true,
    data: {
      summary: `A balanced day in ${place} with food, a bit of culture, and time to wander.`,
      vibe_label: 'Local Explorer',
      pace: 'moderate',
      currency: 'USD',
      estimated_total_cost: 60,
      weather_advice: w ? `${w.emoji} ${w.label} — dress accordingly.` : 'Dress in layers and check the forecast before heading out.',
      activities: [
        { time: '10:00', duration_minutes: 60, category: 'cafe',         title: `Slow morning at a popular café in ${place}`, neighborhood: place, description: 'Start with a strong coffee and watch the morning rhythm.', why: 'Easing into the day beats rushing it.', cost_estimate: 7, tags: ['coffee','slow start'] },
        { time: '11:30', duration_minutes: 90, category: 'sightseeing', title: `Walk through the historic heart of ${place}`, neighborhood: place, description: 'A loop through the most photogenic streets in the old quarter.', why: 'You see most of the city\'s character on foot.', cost_estimate: 0, tags: ['walking','free'] },
        { time: '13:00', duration_minutes: 90, category: 'lunch',       title: `Lunch at a locals\' favorite`, neighborhood: place, description: 'A real meal at a place that doesn\'t cater to tourists.', why: 'Best lunch = where the lunchtime queue is locals.', cost_estimate: 20, tags: ['local','food'] },
        { time: '15:00', duration_minutes: 90, category: 'museum',      title: 'A small but excellent museum', neighborhood: place, description: 'Pick the one with the strongest single-collection, not the biggest.', why: 'Quality beats quantity for a half-day visit.', cost_estimate: 15, tags: ['culture','indoor'] },
        { time: '17:00', duration_minutes: 60, category: 'viewpoint',   title: 'Golden-hour spot', neighborhood: place, description: 'Find a rooftop, hill, or bridge with skyline views.', why: 'Best photos and best feelings of the day.', cost_estimate: 0, tags: ['sunset','photos'] },
        { time: '19:00', duration_minutes: 90, category: 'dinner',      title: 'Dinner at a neighborhood gem', neighborhood: place, description: 'Skip the main square. Walk 3 blocks away and look for full tables of locals.', why: 'Best food per dollar is always one street off the tourist drag.', cost_estimate: 30, tags: ['dinner','local'] }
      ],
      food_picks: [],
      tips: [
        'Wear comfortable shoes — you\'ll walk more than you think.',
        'Carry water and a light layer even when it\'s warm.',
        'Cash and card both — some smaller spots are cash-only.'
      ],
      transport_advice: 'Walk where you can, use the metro or ride-hail for legs over 25 minutes.',
      rainy_plan: 'Swap the outdoor walk for an extra museum or covered market.',
      weather: w,
      location,
      date: dateISO,
      _fallback: true
    }
  };
};

export default { generateDayPlan };
