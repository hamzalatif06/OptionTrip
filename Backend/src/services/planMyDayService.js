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

// ─── Google Places venue resolver ───────────────────────────────────────────
//
// We do NOT trust the LLM to give us accurate coordinates — it hallucinates
// them. Instead, after the plan is generated, every activity + food pick is
// resolved against Google Places API v1 (Text Search), which is the same
// dataset that powers Google Maps. With a 50 km location-bias circle around
// the trip's city, "Boot Café" finds the actual Boot Café in the right city
// instead of one in a different country.
//
// The resolver attaches:
//   - coordinates: { lat, lng }   — precise, from Google
//   - place_id:    "ChIJ..."      — Google's place identifier (best for routing)
//   - address:     full formatted address
//
// All resolutions run in parallel, so this only adds ~1s to plan generation.

const GOOGLE_PLACES_BASE = 'https://places.googleapis.com/v1/places:searchText';

const resolveVenueViaGoogle = async (textQuery, biasCenter) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !textQuery || textQuery.trim().length < 2) return null;

  const body = {
    textQuery,
    maxResultCount: 1,
    languageCode: 'en'
  };

  // Bias the search tightly to the trip's city — 25 km circle is enough for
  // any urban area (catches outskirts + an airport but rejects accidental
  // same-name matches in other cities).
  if (biasCenter && typeof biasCenter.lat === 'number' && typeof biasCenter.lng === 'number') {
    body.locationBias = {
      circle: {
        center: { latitude: biasCenter.lat, longitude: biasCenter.lng },
        radius: 25000
      }
    };
  }

  // Only request the fields we actually use — Places v1 requires an explicit
  // field mask, and a narrower mask means cheaper billing tier.
  const fieldMask = 'places.id,places.displayName,places.location,places.formattedAddress';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(GOOGLE_PLACES_BASE, {
      method: 'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.places?.[0];
    if (!p?.location?.latitude || !p?.location?.longitude) return null;
    return {
      place_id:          p.id,
      name:              p.displayName?.text || null,
      formatted_address: p.formattedAddress  || null,
      lat:               p.location.latitude,
      lng:               p.location.longitude
    };
  } catch (err) {
    console.warn(`Google Places lookup failed for "${textQuery}":`, err.message);
    return null;
  }
};

/**
 * Build the textQuery we hand to Google Places.
 *
 * Strategy: lead with the EXACT venue name + city. This is how a human would
 * search Google Maps and it's what gives us the best hit rate. LLM-supplied
 * street addresses are unreliable (invented numbers) so we ignore them here.
 *
 *   "Boot Café, Paris"
 *   "Cooco's Den, Lahore"
 *   "Borough Market, Southwark, London"
 *
 * The 25 km location-bias circle in the API call handles disambiguation
 * across cities with the same business name.
 */
const venueQueryFor = (item, city) => {
  const name = (item.title || item.name || '').trim();
  if (!name) return null;
  // Strip vague descriptors the LLM might still slip into the name field.
  // ("A popular café in Le Marais" → "café in Le Marais" — Google's never
  //  going to find that, so we just won't match. The fallback button kicks in.)
  if (/^\s*(a|the|some|any)\s+/i.test(name) && name.split(/\s+/).length > 3) return null;
  return [name, item.neighborhood, city].filter(Boolean).join(', ');
};

/**
 * Resolve coordinates + place_id for every activity & food pick in the plan,
 * mutating the plan object in place. Failures per-venue are silent — the
 * frontend already has a fallback for missing coords.
 */
const enrichPlanWithGoogleVenues = async (plan, location) => {
  if (!process.env.GOOGLE_PLACES_API_KEY) return;
  const city       = location?.city || '';
  const biasCenter = (typeof location?.lat === 'number' && typeof location?.lng === 'number')
    ? { lat: location.lat, lng: location.lng }
    : null;

  const resolveOne = async (item) => {
    const query = venueQueryFor(item, city);
    if (!query) return null;
    const r = await resolveVenueViaGoogle(query, biasCenter);
    if (!r) {
      // Optional debug — uncomment to trace miss rate per-city in dev.
      // console.log(`[plan-my-day] no Google match for: ${query}`);
    } else {
      console.log(`[plan-my-day] ✓ ${query} → ${r.name} (${r.lat.toFixed(5)}, ${r.lng.toFixed(5)})`);
    }
    return r;
  };

  const tasks = [];

  if (Array.isArray(plan.activities)) {
    plan.activities.forEach((a) => {
      tasks.push(
        resolveOne(a)
          .then(r => { if (r) {
            a.coordinates   = { lat: r.lat, lng: r.lng };
            a.place_id      = r.place_id;
            a.address       = r.formatted_address || a.address || '';
            a.resolved_name = r.name;
          }})
          .catch(() => {})
      );
    });
  }
  if (Array.isArray(plan.food_picks)) {
    plan.food_picks.forEach((f) => {
      tasks.push(
        resolveOne(f)
          .then(r => { if (r) {
            f.coordinates   = { lat: r.lat, lng: r.lng };
            f.place_id      = r.place_id;
            f.address       = r.formatted_address || f.address || '';
            f.resolved_name = r.name;
          }})
          .catch(() => {})
      );
    });
  }

  await Promise.all(tasks);
};

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
  "rainy_plan": "<1 sentence: 'If it pours, swap X for Y' — concrete swap>",
  "local_phrases": [
    {
      "phrase":      "<word/phrase in the local language using local script if applicable>",
      "pronunciation":"<simple Latin-letter pronunciation hint>",
      "meaning":     "<English meaning>",
      "when":        "<one-line: when/where to use it>"
    }
  ],
  "insider_tips": [
    "<each tip is a sentence that gives the traveler an edge — booking ahead, queue tricks, locals-only timing, free entry days, etiquette traps, hidden entrances, cash-only spots, etc.>"
  ]
}

LOCAL CULTURE RULES
- "local_phrases": include EXACTLY 4 entries — pick high-utility phrases (greeting, thank-you, "the bill please", a polite excuse-me or basic order phrase). Use the actual local script (Arabic, Devanagari, etc.) when applicable; English-only destinations can return phrases like cultural slang or local nicknames.
- "insider_tips": exactly 4 entries — none of these should duplicate the regular "tips" array; this is the "wish I'd known" content that gives an edge.

VENUE-NAMING RULES — CRITICAL FOR ACCURACY
The backend takes your "title" / "name" + "neighborhood" + city and runs it through Google Places. So:
- "title" / "name" MUST be the actual, searchable, real business name a local would recognize. The exact string a user would type into Google Maps.
  ✓ "Boot Café"
  ✓ "Cooco's Den"
  ✓ "Pizzeria Da Michele"
  ✗ "A cozy café in Le Marais"       ← vague description, not a name
  ✗ "Traditional Pakistani lunch spot" ← not a name
  ✗ "The bridge with the great view"   ← describe it, then name a specific bridge: "Pont Alexandre III"
- "neighborhood" must be a real district / area name in the city ("Shibuya", "Trastevere", "Gulberg") — not a building or street.
- "address" — include if you know the street; otherwise repeat "Venue Name, Neighborhood, City". Either is fine; we lead with the venue name in the Google search.
- "coordinates" — OMIT entirely; backend resolves them.
- If you truly don't know a real named venue for a slot, pick something else you DO know — never invent a fake business name to fill the slot.`;
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

    // Resolve precise coordinates + Google place IDs for every venue in
    // parallel (typically ~1s for 6-10 venues). Failures are silent — any
    // un-resolved venue simply keeps the LLM's address fallback.
    await enrichPlanWithGoogleVenues(parsed, location);

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
