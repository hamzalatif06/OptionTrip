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
  destination,
  start_date,
  end_date,
  duration_days,
  tripType,
  guests,
  budget,
  description
}) => {
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

TRIP CONTEXT:
- Destination: ${destination.name}
- Duration: ${duration_days} days (${start_date} to ${end_date})
- Trip Type: ${tripType}
- Travelers: ${guests.total} guests (${guests.adults} adults, ${guests.children} children)
- Budget Level: ${budgetDescriptions[budget]}
- Preferences: ${description || 'General sightseeing and experiences'}

ESTIMATED COST RANGE: $${costRanges[budget].min} - $${costRanges[budget].max} total for ${duration_days} days

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
      "estimated_total_cost": ${Math.round((costRanges[budget].min + costRanges[budget].max) / 2)},
      "ideal_for": "First-time visitors seeking iconic experiences",
      "highlights": [
        {"icon": "clock", "label": "Pace", "value": "Moderate"},
        {"icon": "star", "label": "Activities", "value": "3 per day"},
        {"icon": "heart", "label": "Style", "value": "Balanced"},
        {"icon": "users", "label": "Best For", "value": "${tripType}"}
      ]
    },
    {
      "title": "Relaxed Journey",
      "description": "Leisurely exploration with plenty of downtime",
      "pace": "slow",
      "style": "Slow travel and local immersion",
      "total_days": ${duration_days},
      "estimated_total_cost": ${costRanges[budget].min + 200},
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
      "estimated_total_cost": ${costRanges[budget].max - 200},
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
- Trip Type: ${tripType}
- Travelers: ${guests.total} guests (${guests.adults} adults, ${guests.children} children)
- Budget: ${budgetDescriptions[budget]}
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
- Activity costs: $${costRanges[budget].min} - $${costRanges[budget].max}
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

    const prompt = 'Generate Day ' + dayNumber + ' itinerary for a ' + duration_days + '-day trip.\n\nTRIP CONTEXT:\n- Destination: ' + destination.name + '\n- Day ' + dayNumber + ' Date: ' + dateStr + '\n- Trip Type: ' + tripType + '\n- Travelers: ' + guests.total + ' guests (' + guests.adults + ' adults, ' + guests.children + ' children)\n- Budget: ' + budgetDescriptions[budget] + '\n- Preferences: ' + (description || 'General sightseeing') + '\n\nSELECTED TRIP STYLE:\n- Style: ' + selectedOption.title + ' - ' + selectedOption.description + '\n- Pace: ' + selectedOption.pace + '\n- Activities per day: ' + activitiesPerDay[selectedOption.pace] + previousDaysContext + '\n\nCRITICAL RULES:\n- Generate ONLY Day ' + dayNumber + '\n- Include ' + activitiesPerDay[selectedOption.pace] + ' activities\n- Each activity MUST include "place_name" with a REAL, searchable location in ' + destination.name + '\n- Do NOT repeat places from previous days\n- Activity costs: $' + costRanges[budget].min + ' - $' + costRanges[budget].max + '\n- Match the ' + selectedOption.pace + ' pace\n' + (dayNumber === 1 ? '- This is arrival day - include settling in activities\n' : '') + (dayNumber === duration_days ? '- This is departure day - include wrap-up activities\n' : '') + '\n\nREQUIRED JSON FORMAT:\n{\n  "day": {\n    "day_number": ' + dayNumber + ',\n    "date": "' + dateStr + '",\n    "title": "Day ' + dayNumber + ': [Creative Title]",\n    "summary": "Brief summary of the day",\n    "activities": [\n      {\n        "time": "09:00 AM",\n        "title": "Activity Title",\n        "description": "Detailed description",\n        "place_name": "Real Place Name in ' + destination.name + '",\n        "location": {\n          "name": "' + destination.name + '",\n          "coordinates": {"lat": 0, "lng": 0}\n        },\n        "duration": "2 hours",\n        "cost": 75,\n        "category": "sightseeing",\n        "image": "",\n        "rating": 0,\n        "address": "",\n        "place_id": ""\n      }\n    ],\n    "total_cost": 0\n  }\n}\n\nReturn ONLY the JSON object.';

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
 * Parse a natural language trip description into structured trip data
 * Used by the "What you love" smart textarea feature
 */
export const parseTripDescription = async (text) => {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  const today = new Date().toISOString().split('T')[0];

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a travel assistant that extracts structured trip information from natural language text.
Today's date is ${today}.

Extract the following fields from the user's trip description and return ONLY valid JSON (no markdown, no explanation):

{
  "destination": {
    "text": "City, Country or region as written",
    "name": "City or place name only"
  },
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "duration_days": number or null,
  "tripType": one of ["Adventure", "Cultural", "Relaxation", "Family", "Romantic", "Business", "Budget", "Luxury"] or null,
  "guests": {
    "adults": number or null,
    "children": number or null,
    "infants": number or null
  },
  "budget": one of ["budget", "moderate", "luxury", "premium"] or null,
  "activities": ["array", "of", "detected", "interests"] or []
}

Rules:
- If a field is not mentioned, return null for it (or [] for arrays)
- For guests: "family of 4" = 2 adults + 2 children. "couple" = 2 adults. "solo" = 1 adult. "wife and 2 kids" = 2 adults 2 children. "me and my friend" = 2 adults.
- For budget: "cheap/backpacker/economy" = "budget", "mid-range/moderate/normal" = "moderate", "high-end/luxury/5-star" = "luxury", "ultra-luxury/premium/first-class" = "premium"
- For tripType: detect from context - mentions of kids/family = "Family", romantic/honeymoon/couple = "Romantic", hiking/climbing/extreme = "Adventure", history/museum/culture = "Cultural", beach/spa/relax = "Relaxation"
- For duration: if user says "5 days", set duration_days=5 and compute end_date from start_date if available
- Dates: interpret relative dates (e.g. "next month", "in July") from today's date ${today}
- activities: extract hobbies/interests like "hiking", "local food", "art galleries", "beaches" etc.`
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from any surrounding text
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {};
  }
};

export default {
  generateLightweightTripOptions,
  generateDetailedItinerary,
  generateSingleDayItinerary,
  parseTripDescription
};
