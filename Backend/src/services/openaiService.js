/**
 * OpenAI Service
 * Handles all OpenAI API interactions for trip generation
 */

import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai = null;

const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

/**
 * PHASE 1: Generate lightweight trip options (FAST)
 * Returns 3 trip options with NO detailed itinerary
 */
export const generateLightweightTripOptions = async ({
  origin,
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description
}) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = createPhase1Prompt({
      origin,
      destination,
      start_date,
      end_date,
      duration_days,
      tripType,
      guests,
      budget,
      description
    });

    console.log('🚀 Phase 1: Generating lightweight trip options...');

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI trip planner.

CRITICAL RULES:
- Generate exactly 3 different trip options
- Do NOT generate daily itineraries
- Do NOT generate activities
- Do NOT generate places
- Do NOT include images
- Do NOT include coordinates

Return ONLY valid JSON format with NO markdown, NO code blocks, NO backticks.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    console.log('✅ Phase 1 Response length:', responseText?.length || 0);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Phase 1 response:', responseText?.substring(0, 200));
      throw new Error('OpenAI returned invalid JSON in Phase 1');
    }

    if (!parsedResponse.options || !Array.isArray(parsedResponse.options)) {
      console.error('Invalid Phase 1 structure:', Object.keys(parsedResponse));
      throw new Error('Invalid response structure from OpenAI Phase 1');
    }

    // Add option IDs
    const options = parsedResponse.options.map((option, index) => ({
      ...option,
      option_id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      itinerary_generated: false
    }));

    return options;

  } catch (error) {
    console.error('❌ Phase 1 OpenAI Error:', error);
    throw new Error(`Failed to generate lightweight options: ${error.message}`);
  }
};

/**
 * PHASE 2: Generate detailed itinerary for selected option (SLOW)
 * Returns day-by-day itinerary with activities and place names
 */
export const generateDetailedItinerary = async ({
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description,
  selectedOption
}) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = createPhase2Prompt({
      destination,
      start_date,
      end_date,
      duration_days,
      tripType,
      guests,
      budget,
      description,
      selectedOption
    });

    console.log('🚀 Phase 2: Generating detailed itinerary...');

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert travel planner AI.

CRITICAL RULES:
- Generate day-by-day itinerary for ${duration_days} days
- Each activity MUST include a "place_name" with a real, searchable location
- Do NOT generate images or coordinates (only place names)
- Match the pace and style: ${selectedOption.pace} pace, ${selectedOption.style} style

Return ONLY valid JSON format with NO markdown, NO code blocks, NO backticks.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    console.log('✅ Phase 2 Response length:', responseText?.length || 0);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Phase 2 response:', responseText?.substring(0, 200));
      throw new Error('OpenAI returned invalid JSON in Phase 2');
    }

    if (!parsedResponse.itinerary || !Array.isArray(parsedResponse.itinerary)) {
      console.error('Invalid Phase 2 structure:', Object.keys(parsedResponse));
      throw new Error('Invalid response structure from OpenAI Phase 2');
    }

    return parsedResponse.itinerary;

  } catch (error) {
    console.error('❌ Phase 2 OpenAI Error:', error);
    throw new Error(`Failed to generate detailed itinerary: ${error.message}`);
  }
};

/**
 * PHASE 1 PROMPT: Generate lightweight trip options only
 */
const createPhase1Prompt = ({
  origin,
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description
}) => {
  const resolvedTripType = tripType || 'General';
  const resolvedBudget   = budget   || 'moderate';
  const resolvedGuests   = guests   || { total: 1, adults: 1, children: 0, infants: 0 };
  const originLine = origin && origin.name ? `\n- Origin (departure city): ${origin.name}` : '';
  const budgetDescriptions = {
    budget: 'Budget-friendly ($) - affordable activities, local eateries',
    moderate: 'Moderate ($$) - mix of paid and free activities',
    luxury: 'Luxury ($$$) - premium experiences, fine dining',
    premium: 'Premium ($$$$) - ultra-luxury, private experiences'
  };

  const costRanges = {
    budget: { min: 300, max: 800 },
    moderate: { min: 800, max: 2000 },
    luxury: { min: 2000, max: 5000 },
    premium: { min: 5000, max: 15000 }
  };

  return `You are an AI trip planner.

Generate exactly 3 different trip options.

TRIP CONTEXT:${originLine}
- Destination: ${destination.name}
- Duration: ${duration_days} days (${start_date} to ${end_date})
- Trip Type: ${resolvedTripType}
- Travelers: ${resolvedGuests.total} guests (${resolvedGuests.adults} adults, ${resolvedGuests.children} children)
- Budget Level: ${budgetDescriptions[resolvedBudget]}
- Preferences: ${description || 'General sightseeing and experiences'}

ESTIMATED COST RANGE: $${costRanges[resolvedBudget].min} - $${costRanges[resolvedBudget].max} total for ${duration_days} days

IMPORTANT RULES:
- Do NOT generate daily itineraries
- Do NOT generate activities
- Do NOT generate places
- Do NOT include images
- Do NOT include coordinates

ONLY return:
- title (creative, appealing name)
- description (1-2 sentence summary of this trip style)
- pace (must be: "slow", "moderate", or "fast")
- style (the overall trip style/theme)
- total_days (${duration_days})
- estimated_total_cost (realistic estimate in USD)
- ideal_for (who this trip style suits best)
- highlights (4 key features as array of {icon, label, value})

REQUIRED JSON FORMAT:
{
  "options": [
    {
      "title": "Balanced Explorer",
      "description": "Perfect mix of must-see attractions and hidden gems with comfortable pacing",
      "pace": "moderate",
      "style": "Balanced sightseeing and relaxation",
      "total_days": ${duration_days},
      "estimated_total_cost": ${Math.round((costRanges[resolvedBudget].min + costRanges[resolvedBudget].max) / 2)},
      "ideal_for": "First-time visitors seeking iconic experiences",
      "highlights": [
        {"icon": "clock", "label": "Pace", "value": "Moderate"},
        {"icon": "star", "label": "Activities", "value": "3 per day"},
        {"icon": "heart", "label": "Style", "value": "Balanced"},
        {"icon": "users", "label": "Best For", "value": "${resolvedTripType}"}
      ]
    },
    {
      "title": "Relaxed Journey",
      "description": "Leisurely exploration with plenty of downtime",
      "pace": "slow",
      "style": "Slow travel and local immersion",
      "total_days": ${duration_days},
      "estimated_total_cost": ${costRanges[resolvedBudget].min + 200},
      "ideal_for": "Travelers who prefer a relaxed pace",
      "highlights": [
        {"icon": "clock", "label": "Pace", "value": "Relaxed"},
        {"icon": "star", "label": "Activities", "value": "2 per day"},
        {"icon": "coffee", "label": "Style", "value": "Laid-back"},
        {"icon": "heart", "label": "Focus", "value": "Local life"}
      ]
    },
    {
      "title": "Action-Packed Adventure",
      "description": "Maximum experiences packed into every day",
      "pace": "fast",
      "style": "Adventure and exploration",
      "total_days": ${duration_days},
      "estimated_total_cost": ${costRanges[resolvedBudget].max - 200},
      "ideal_for": "Adventurers seeking to see and do it all",
      "highlights": [
        {"icon": "bolt", "label": "Pace", "value": "Fast"},
        {"icon": "star", "label": "Activities", "value": "4 per day"},
        {"icon": "adventure", "label": "Style", "value": "Action"},
        {"icon": "energy", "label": "Energy", "value": "High"}
      ]
    }
  ]
}

Return ONLY the JSON object. No markdown, no explanations.`;
};

/**
 * PHASE 2 PROMPT: Generate detailed itinerary for selected option
 */
const createPhase2Prompt = ({
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description,
  selectedOption
}) => {
  const resolvedTripType = tripType || 'General';
  const resolvedBudget   = budget   || 'moderate';
  const resolvedGuests   = guests   || { total: 1, adults: 1, children: 0, infants: 0 };
  const budgetDescriptions = {
    budget: 'Budget-friendly ($) - affordable activities, local eateries',
    moderate: 'Moderate ($$) - mix of paid and free activities',
    luxury: 'Luxury ($$$) - premium experiences, fine dining',
    premium: 'Premium ($$$$) - ultra-luxury, private experiences'
  };

  const costRanges = {
    budget: { min: 20, max: 50 },
    moderate: { min: 50, max: 120 },
    luxury: { min: 120, max: 250 },
    premium: { min: 250, max: 500 }
  };

  const activitiesPerDay = {
    slow: 2,
    moderate: 3,
    fast: 4
  };

  return `You are an expert travel planner AI.

Generate a detailed day-by-day itinerary for the selected trip option.

TRIP CONTEXT:
- Destination: ${destination.name}
- Duration: ${duration_days} days (${start_date} to ${end_date})
- Trip Type: ${resolvedTripType}
- Travelers: ${resolvedGuests.total} guests (${resolvedGuests.adults} adults, ${resolvedGuests.children} children)
- Budget: ${budgetDescriptions[resolvedBudget]}
- Preferences: ${description || 'General sightseeing'}

SELECTED OPTION:
- Style: ${selectedOption.title} - ${selectedOption.description}
- Pace: ${selectedOption.pace}
- Activities per day: ${activitiesPerDay[selectedOption.pace]}

CRITICAL RULES:
- Generate ${duration_days} days of itinerary
- Each day must have ${activitiesPerDay[selectedOption.pace]} activities
- Each activity MUST include "place_name" with a REAL, searchable location in ${destination.name}
- Do NOT generate images (leave image field empty)
- Do NOT generate coordinates (leave lat/lng as 0)
- Activity costs: $${costRanges[resolvedBudget].min} - $${costRanges[resolvedBudget].max}
- Match the ${selectedOption.pace} pace and ${selectedOption.style} style

REQUIRED JSON FORMAT:
{
  "itinerary": [
    {
      "day_number": 1,
      "date": "${start_date}",
      "title": "Day 1: Arrival and Introduction",
      "summary": "Start your journey in ${destination.name}",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Visit Iconic Landmark",
          "description": "Explore this famous attraction with guided insights",
          "place_name": "Eiffel Tower",
          "location": {
            "name": "${destination.name}",
            "coordinates": {"lat": 0, "lng": 0}
          },
          "duration": "2 hours",
          "cost": 75,
          "category": "sightseeing",
          "image": "",
          "rating": 0,
          "address": "",
          "place_id": ""
        }
      ],
      "total_cost": 0
    }
  ]
}

REQUIREMENTS:
1. Generate all ${duration_days} days
2. ${activitiesPerDay[selectedOption.pace]} activities per day
3. Use realistic times: 09:00 AM, 12:00 PM, 03:00 PM, 06:00 PM, 07:00 PM
4. Categories: sightseeing, dining, adventure, culture, relaxation, shopping, transport
5. Each place_name must be a REAL location in ${destination.name}
6. Calculate total_cost for each day (sum of activity costs)
7. Consider ${tripType} preferences
8. Family-friendly if children present

Return ONLY the JSON object. No markdown, no explanations.`;
};


/**
 * PHASE 2B: Generate itinerary for a SINGLE DAY (for progressive loading)
 * Returns a single day's itinerary with activities
 */
export const generateSingleDayItinerary = async ({
  destination,
  start_date,
  duration_days,
  tripType,
  guests,
  budget,
  description,
  selectedOption,
  dayNumber,
  previousDays = []
}) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OpenAI API key not configured');
    }

    const currentDate = new Date(start_date);
    currentDate.setDate(currentDate.getDate() + dayNumber - 1);
    const dateStr = currentDate.toISOString().split('T')[0];

    const resolvedTripType = tripType || 'General';
    const resolvedBudget   = budget   || 'moderate';
    const resolvedGuests   = guests   || { total: 1, adults: 1, children: 0, infants: 0 };

    const budgetDescriptions = {
      budget: 'Budget-friendly ($) - affordable activities, local eateries',
      moderate: 'Moderate ($$) - mix of paid and free activities',
      luxury: 'Luxury ($$$) - premium experiences, fine dining',
      premium: 'Premium ($$$$) - ultra-luxury, private experiences'
    };

    const costRanges = {
      budget: { min: 20, max: 50 },
      moderate: { min: 50, max: 120 },
      luxury: { min: 120, max: 250 },
      premium: { min: 250, max: 500 }
    };

    const activitiesPerDay = {
      slow: 2,
      moderate: 3,
      fast: 4
    };

    // Build context from previous days to ensure consistency
    const previousDaysContext = previousDays.length > 0
      ? '\n\nPREVIOUS DAYS (avoid repetition):\n' + previousDays.map(d =>
          'Day ' + d.day_number + ': ' + d.title + ' - ' + (d.activities?.map(a => a.title).join(', ') || '')
        ).join('\n')
      : '';

    const prompt = 'Generate Day ' + dayNumber + ' itinerary for a ' + duration_days + '-day trip.\n\nTRIP CONTEXT:\n- Destination: ' + destination.name + '\n- Day ' + dayNumber + ' Date: ' + dateStr + '\n- Trip Type: ' + resolvedTripType + '\n- Travelers: ' + resolvedGuests.total + ' guests (' + resolvedGuests.adults + ' adults, ' + resolvedGuests.children + ' children)\n- Budget: ' + budgetDescriptions[resolvedBudget] + '\n- Preferences: ' + (description || 'General sightseeing') + '\n\nSELECTED TRIP STYLE:\n- Style: ' + selectedOption.title + ' - ' + selectedOption.description + '\n- Pace: ' + selectedOption.pace + '\n- Activities per day: ' + activitiesPerDay[selectedOption.pace] + previousDaysContext + '\n\nCRITICAL RULES:\n- Generate ONLY Day ' + dayNumber + '\n- Include ' + activitiesPerDay[selectedOption.pace] + ' activities\n- Each activity MUST include "place_name" with a REAL, searchable location in ' + destination.name + '\n- Do NOT repeat places from previous days\n- Activity costs: $' + costRanges[resolvedBudget].min + ' - $' + costRanges[resolvedBudget].max + '\n- Match the ' + selectedOption.pace + ' pace\n' + (dayNumber === 1 ? '- This is arrival day - include settling in activities\n' : '') + (dayNumber === duration_days ? '- This is departure day - include wrap-up activities\n' : '') + '\n\nREQUIRED JSON FORMAT:\n{\n  "day": {\n    "day_number": ' + dayNumber + ',\n    "date": "' + dateStr + '",\n    "title": "Day ' + dayNumber + ': [Creative Title]",\n    "summary": "Brief summary of the day",\n    "activities": [\n      {\n        "time": "09:00 AM",\n        "title": "Activity Title",\n        "description": "Detailed description",\n        "place_name": "Real Place Name in ' + destination.name + '",\n        "location": {\n          "name": "' + destination.name + '",\n          "coordinates": {"lat": 0, "lng": 0}\n        },\n        "duration": "2 hours",\n        "cost": 75,\n        "category": "sightseeing",\n        "image": "",\n        "rating": 0,\n        "address": "",\n        "place_id": ""\n      }\n    ],\n    "total_cost": 0\n  }\n}\n\nReturn ONLY the JSON object.';

    console.log('🚀 Generating Day ' + dayNumber + ' itinerary...');

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner AI. Generate a single day itinerary. Return ONLY valid JSON format with NO markdown, NO code blocks, NO backticks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    console.log('✅ Day ' + dayNumber + ' Response length:', responseText?.length || 0);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Day ' + dayNumber + ' response:', responseText?.substring(0, 200));
      throw new Error('OpenAI returned invalid JSON for Day ' + dayNumber);
    }

    if (!parsedResponse.day) {
      console.error('Invalid Day ' + dayNumber + ' structure:', Object.keys(parsedResponse));
      throw new Error('Invalid response structure for Day ' + dayNumber);
    }

    return parsedResponse.day;

  } catch (error) {
    console.error('❌ Error generating Day ' + dayNumber + ':', error);
    throw new Error('Failed to generate Day ' + dayNumber + ': ' + error.message);
  }
};

/**
 * Parse a natural language trip description into structured trip data.
 * Powers both the "What you love" textarea and the voice (speech-to-text) input,
 * so inputs may contain run-on sentences, filler words, and minor mistranscriptions.
 */
export const parseTripDescription = async (text) => {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  const systemPrompt = `You are a precise travel-information extractor. Input may come from a typed textbox OR a speech-to-text transcript — tolerate run-on sentences, filler words ("uh", "like"), missing punctuation, and homophone errors.

Today's date is ${today}. The current year is ${currentYear}.

Return ONLY a JSON object with this exact shape (no markdown, no commentary):

{
  "origin": { "text": "City, Country or as written", "name": "City only" } | null,
  "destination": { "text": "City, Country or as written", "name": "City only" } | null,
  "start_date": "YYYY-MM-DD" | null,
  "end_date":   "YYYY-MM-DD" | null,
  "duration_days": integer | null,
  "tripType": "Adventure" | "Cultural" | "Relaxation" | "Family" | "Romantic" | "Business" | "Budget" | "Luxury" | null,
  "guests": { "adults": integer | null, "children": integer | null, "infants": integer | null },
  "budget":  "budget" | "moderate" | "luxury" | "premium" | null,
  "activities": string[]
}

EXTRACTION RULES:

1. ORIGIN vs DESTINATION (critical):
   - "from X to Y" / "X to Y" → origin = X, destination = Y.
   - "from X" / "leaving X" / "departing X" / "out of X" / "based in X" → origin = X.
   - "to Y" / "going to Y" / "visit Y" / "trip to Y" / "fly to Y" / "in Y" / "vacation in Y" → destination = Y.
   - If only ONE city is mentioned, it is the DESTINATION (never the origin).
   - Never put the same city in both fields.
   - Use the city's well-known country in the "text" field when obvious ("Paris" → "Paris, France").

2. GUESTS:
   - "solo" / "alone" / "by myself" / "just me" → 1 adult.
   - "me and my girlfriend / boyfriend / partner / wife / husband / spouse / fiancé / fiancée" → 2 adults.
   - "couple" / "the two of us" / "honeymoon" → 2 adults.
   - "me and my friend" → 2 adults; "with my friends" (plural, no number) → 2 adults default.
   - "family of N": N≤2 → N adults; N=3 → 2 adults + 1 child; N≥4 → 2 adults + (N-2) children.
   - "wife and 2 kids" → adults includes speaker + spouse; kids → children.
   - "infants" / "babies" → infants. Otherwise minors → children.
   - Use explicit numbers when stated.
   - If guests not mentioned at all → leave the three numbers as null.

3. TRIP TYPE (single strongest signal; null if no signal):
   - Romantic: girlfriend / boyfriend / partner / wife / husband / honeymoon / anniversary / couple / romantic.
   - Family: kids / children / family / parents / in-laws.
   - Adventure: hiking / climbing / surf / dive / ski / safari / trek / extreme / adrenaline.
   - Cultural: museum / history / art / heritage / temple / monument / local culture.
   - Relaxation: beach / spa / resort / chill / relax / unwind / yoga / wellness.
   - Business: business / conference / meeting / work trip.
   - Budget / Luxury: ONLY when user explicitly frames the *style* of the trip (rare; budget level usually goes in "budget").
   - Tiebreakers: partner+kids → Romantic; sport/outdoor+culture → Adventure.

4. DATES:
   - Resolve relative dates from today (${today}): "next month", "this weekend", "in 3 weeks", "tomorrow".
   - Bare month/day with no year ("July 23", "in July", "23rd of July"): use ${currentYear} if that date is today or later, otherwise use ${currentYear + 1}.
   - "fly on X" / "leave on X" / "depart on X" / "arrive on X" → start_date = X.
   - "come back on Y" / "return on Y" / "fly back on Y" → end_date = Y.
   - "for N days" → duration_days = N. If start_date known, end_date = start_date + (N − 1).
   - "for N nights" → duration_days = N + 1.
   - "come back after N days" / "return after N days" / "stay for N days" → duration_days = N; end_date = start_date + (N − 1).
   - "come back N days later" / "return N days later" → end_date = start_date + N; duration_days = N + 1.
   - "weekend trip" → duration_days = 3.
   - If only end_date + duration are known → start_date = end_date − (duration_days − 1).
   - Emit only valid YYYY-MM-DD or null. Never partial dates.

5. BUDGET:
   - "cheap" / "backpacker" / "shoestring" / "hostel" / "economy" → "budget".
   - "mid-range" / "moderate" / "normal" / "average" → "moderate".
   - "luxury" / "high-end" / "5-star" / "premium hotels" → "luxury".
   - "ultra-luxury" / "premium" / "first-class" / "private jet" → "premium".
   - Explicit total amount: <$700 → budget, $700–$2000 → moderate, $2000–$5000 → luxury, >$5000 → premium.

6. ACTIVITIES:
   - Concrete interests only: "hiking", "local food", "art galleries", "beaches", "nightlife", "wine tasting", "diving".
   - Skip generic words: "trip", "vacation", "fun", "experience".

7. WHEN UNSURE → null for that field. Never invent.

EXAMPLES:

Input: "plan a trip to paris from london and i am with my girlfriend and i want to fly on july 23 and come back after 3 days"
Output: {"origin":{"text":"London, UK","name":"London"},"destination":{"text":"Paris, France","name":"Paris"},"start_date":"<resolved-July-23>","end_date":"<start+2>","duration_days":3,"tripType":"Romantic","guests":{"adults":2,"children":0,"infants":0},"budget":null,"activities":[]}

Input: "honeymoon in Bali for 10 nights, luxury resorts please"
Output: {"origin":null,"destination":{"text":"Bali, Indonesia","name":"Bali"},"start_date":null,"end_date":null,"duration_days":11,"tripType":"Romantic","guests":{"adults":2,"children":0,"infants":0},"budget":"luxury","activities":[]}

Input: "family of 4 to Rome next month for a week, we love food and art"
Output: {"origin":null,"destination":{"text":"Rome, Italy","name":"Rome"},"start_date":"<resolved>","end_date":"<start+6>","duration_days":7,"tripType":"Family","guests":{"adults":2,"children":2,"infants":0},"budget":null,"activities":["local food","art"]}

Input: "solo backpacking Vietnam, hostels, departing 5 March, 14 days"
Output: {"origin":null,"destination":{"text":"Vietnam","name":"Vietnam"},"start_date":"<resolved-Mar-5>","end_date":"<start+13>","duration_days":14,"tripType":"Adventure","guests":{"adults":1,"children":0,"infants":0},"budget":"budget","activities":["backpacking"]}

Return ONLY the JSON. No explanations, no markdown fences.`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: text }
    ],
    temperature: 0,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : {};
  }

  console.log('🎤 parseTripDescription input:', text);
  console.log('🎯 parseTripDescription raw model output:', raw);
  const sanitized = sanitizeParsedTrip(parsed, today);
  console.log('🧹 parseTripDescription sanitized:', JSON.stringify(sanitized));
  return sanitized;
};

/**
 * Defensive post-processing of the LLM output.
 * Enforces shape and corrects common model slips (same city in origin+destination,
 * invalid dates, past dates for future-intent phrases, missing derivable fields).
 */
const sanitizeParsedTrip = (p, todayStr) => {
  const out = {
    origin: null,
    destination: null,
    start_date: null,
    end_date: null,
    duration_days: null,
    tripType: null,
    guests: { adults: null, children: null, infants: null },
    budget: null,
    activities: [],
  };

  const isValidDate = (s) => typeof s === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(s)
    && !isNaN(new Date(s).getTime());

  if (!p || typeof p !== 'object') return out;

  if (p.origin && p.origin.text) {
    out.origin = { text: String(p.origin.text), name: String(p.origin.name || p.origin.text) };
  }
  if (p.destination && p.destination.text) {
    out.destination = { text: String(p.destination.text), name: String(p.destination.name || p.destination.text) };
  }
  // Same-city protection (model occasionally echoes destination into origin)
  if (out.origin && out.destination &&
      out.origin.name.trim().toLowerCase() === out.destination.name.trim().toLowerCase()) {
    out.origin = null;
  }

  if (isValidDate(p.start_date)) out.start_date = p.start_date;
  if (isValidDate(p.end_date))   out.end_date   = p.end_date;

  if (Number.isInteger(p.duration_days) && p.duration_days > 0 && p.duration_days <= 60) {
    out.duration_days = p.duration_days;
  }

  // Derive missing fields from the others
  if (out.start_date && out.end_date) {
    const days = Math.round((new Date(out.end_date) - new Date(out.start_date)) / 86400000) + 1;
    if (days > 0 && days <= 60) out.duration_days = days;
  } else if (out.start_date && out.duration_days && !out.end_date) {
    const s = new Date(out.start_date);
    s.setDate(s.getDate() + out.duration_days - 1);
    out.end_date = s.toISOString().split('T')[0];
  } else if (out.end_date && out.duration_days && !out.start_date) {
    const e = new Date(out.end_date);
    e.setDate(e.getDate() - (out.duration_days - 1));
    out.start_date = e.toISOString().split('T')[0];
  }

  // If model emitted past dates for a future-intent phrase, bump by one year
  if (out.start_date && out.start_date < todayStr) {
    const s = new Date(out.start_date);
    s.setFullYear(s.getFullYear() + 1);
    out.start_date = s.toISOString().split('T')[0];
    if (out.end_date) {
      const e = new Date(out.end_date);
      e.setFullYear(e.getFullYear() + 1);
      out.end_date = e.toISOString().split('T')[0];
    }
  }

  const ALLOWED_TYPES = ['Adventure','Cultural','Relaxation','Family','Romantic','Business','Budget','Luxury'];
  if (ALLOWED_TYPES.includes(p.tripType)) out.tripType = p.tripType;

  if (p.guests && typeof p.guests === 'object') {
    const a = Number.isInteger(p.guests.adults)   ? p.guests.adults   : null;
    const c = Number.isInteger(p.guests.children) ? p.guests.children : null;
    const i = Number.isInteger(p.guests.infants)  ? p.guests.infants  : null;
    out.guests = {
      adults:   a !== null && a >= 0 && a <= 20 ? a : null,
      children: c !== null && c >= 0 && c <= 20 ? c : null,
      infants:  i !== null && i >= 0 && i <= 10 ? i : null,
    };
  }

  const ALLOWED_BUDGET = ['budget','moderate','luxury','premium'];
  if (ALLOWED_BUDGET.includes(p.budget)) out.budget = p.budget;

  if (Array.isArray(p.activities)) {
    out.activities = p.activities.filter(a => typeof a === 'string' && a.trim()).slice(0, 10);
  }

  return out;
};

export default {
  generateLightweightTripOptions,
  generateDetailedItinerary,
  generateSingleDayItinerary,
  parseTripDescription
};
