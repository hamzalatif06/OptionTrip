/**
 * Chat Service
 * Handles AI-powered chat for Vi Travel Assistant
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
 * Generate AI response for Vi assistant
 * @param {string} userMessage - User's message
 * @param {Object} context - User and trip context
 * @returns {Promise<Object>} AI response with text and quick replies
 */
export const generateViResponse = async (userMessage, context = {}) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      // Fallback to rule-based responses if no API key
      return generateFallbackResponse(userMessage, context);
    }

    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(userMessage, context);

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse chat response:', responseText?.substring(0, 200));
      return generateFallbackResponse(userMessage, context);
    }

    return {
      text: parsedResponse.message || parsedResponse.text || "I'm here to help with your travel needs!",
      type: parsedResponse.type || 'general',
      quickReplies: parsedResponse.quickReplies || getContextualQuickReplies(context)
    };

  } catch (error) {
    console.error('Chat AI Error:', error);
    return generateFallbackResponse(userMessage, context);
  }
};

/**
 * Build system prompt with travel assistant personality
 */
const buildSystemPrompt = (context) => {
  const { user, currentTrip, tripPhase, allTrips } = context;

  let prompt = `You are Vi, a friendly and knowledgeable AI travel assistant for OptionTrip.

YOUR PERSONALITY:
- Warm, helpful, and enthusiastic about travel
- Professional but conversational
- Use occasional travel-related emojis (1-2 per response max)
- Provide practical, actionable advice
- Be concise but informative

YOUR CAPABILITIES:
- Help users plan trips and provide destination information
- Offer packing tips, local customs, and travel etiquette
- Provide emergency assistance information
- Suggest restaurants, transportation, and activities
- Answer questions about their saved trips

RESPONSE FORMAT (JSON):
{
  "message": "Your helpful response here",
  "type": "greeting|info|emergency|planning|trip_details|general",
  "quickReplies": ["Option 1", "Option 2", "Option 3"]
}

RULES:
- Keep responses under 200 words
- Always include 2-4 relevant quick reply options
- If asked about specific real-time data (weather, prices), recommend reliable sources
- Be honest if you don't know something specific
- For emergencies, always provide international emergency number (112) first`;

  // Add user context if authenticated
  if (user) {
    prompt += `\n\nUSER CONTEXT:
- Name: ${user.name || 'User'}
- Has ${allTrips?.length || 0} saved trip(s)`;
  }

  // Add current trip context
  if (currentTrip) {
    prompt += `\n\nCURRENT TRIP:
- Destination: ${currentTrip.destination?.name || 'Unknown'}
- Dates: ${currentTrip.dates?.start_date || 'TBD'} to ${currentTrip.dates?.end_date || 'TBD'}
- Duration: ${currentTrip.dates?.duration_days || 0} days
- Trip Type: ${currentTrip.trip_type || 'Leisure'}
- Travelers: ${currentTrip.guests?.total || 1} people
- Budget: ${currentTrip.budget || 'Standard'}
- Trip Phase: ${tripPhase || 'planning'} (before/during/after trip)`;
  }

  return prompt;
};

/**
 * Build user prompt with message and context
 */
const buildUserPrompt = (userMessage, context) => {
  const { tripPhase, currentTrip } = context;

  let prompt = `User message: "${userMessage}"`;

  if (tripPhase && currentTrip) {
    prompt += `\n\nContext: User is ${tripPhase === 'before' ? 'preparing for an upcoming' : tripPhase === 'during' ? 'currently on their' : 'reflecting on their recent'} trip to ${currentTrip.destination?.name || 'their destination'}.`;
  }

  prompt += '\n\nProvide a helpful response in JSON format.';

  return prompt;
};

/**
 * Generate fallback response without AI
 */
const generateFallbackResponse = (userMessage, context) => {
  const lowerMessage = userMessage.toLowerCase();
  const { user, currentTrip, tripPhase } = context;
  const userName = user?.name?.split(' ')[0] || '';
  const destination = currentTrip?.destination?.name || '';

  // Greeting responses
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
    return {
      text: `Hello${userName ? ` ${userName}` : ''}! How can I help you with your travel plans today?`,
      type: 'greeting',
      quickReplies: getContextualQuickReplies(context)
    };
  }

  // Emergency responses
  if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('sos')) {
    return {
      text: `For emergencies:\n- International: 112\n- US: 911 | UK: 999 | EU: 112\n\n${destination ? `In ${destination}, also note your hotel's emergency contact and the nearest embassy.` : ''}\n\nHow can I help you further?`,
      type: 'emergency',
      quickReplies: ['Local Embassy', 'Hospital Info', 'Police Contact']
    };
  }

  // Packing tips
  if (lowerMessage.includes('pack') || lowerMessage.includes('luggage') || lowerMessage.includes('bring')) {
    const duration = currentTrip?.dates?.duration_days || 5;
    return {
      text: `Packing essentials for your ${duration}-day trip:\n\n- Travel documents & copies\n- Phone charger & adapter\n- Medications\n- ${Math.ceil(duration * 0.7)} tops, ${Math.ceil(duration * 0.5)} bottoms\n- Comfortable walking shoes\n\nNeed destination-specific tips?`,
      type: 'packing',
      quickReplies: ['Weather Info', 'Electronics', 'Toiletries Checklist']
    };
  }

  // Weather
  if (lowerMessage.includes('weather') || lowerMessage.includes('climate')) {
    return {
      text: `For accurate weather forecasts${destination ? ` in ${destination}` : ''}, I recommend checking Weather.com or AccuWeather closer to your trip date. Pack layers and a light rain jacket just in case!`,
      type: 'weather',
      quickReplies: ['Packing Tips', 'What to Wear', 'Best Time to Visit']
    };
  }

  // Restaurant/Food
  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
    return {
      text: `For great dining${destination ? ` in ${destination}` : ''}:\n\n- Check TripAdvisor or Google Maps reviews\n- Ask your hotel concierge for local favorites\n- Look for places busy with locals\n- Try the local specialties!\n\nAny specific cuisine you're looking for?`,
      type: 'dining',
      quickReplies: ['Local Cuisine', 'Budget Options', 'Fine Dining']
    };
  }

  // Transportation
  if (lowerMessage.includes('transport') || lowerMessage.includes('taxi') || lowerMessage.includes('uber') || lowerMessage.includes('getting around')) {
    return {
      text: `Transportation options${destination ? ` in ${destination}` : ''}:\n\n- Ride-sharing (Uber, Lyft, local apps)\n- Public transit (usually cheapest)\n- Official taxi stands\n- Rental cars for outside city\n\nDownload offline maps before you go!`,
      type: 'transport',
      quickReplies: ['Airport Transfer', 'Public Transit', 'Car Rental']
    };
  }

  // Trip details
  if ((lowerMessage.includes('my trip') || lowerMessage.includes('trip detail')) && currentTrip) {
    return {
      text: `Your trip to ${destination}:\n\n- Dates: ${currentTrip.dates?.start_date || 'TBD'} to ${currentTrip.dates?.end_date || 'TBD'}\n- Duration: ${currentTrip.dates?.duration_days || 0} days\n- Travelers: ${currentTrip.guests?.total || 1}\n- Budget: ${currentTrip.budget || 'Standard'}\n\nHow can I help you prepare?`,
      type: 'trip_details',
      quickReplies: tripPhase === 'before'
        ? ['Packing List', 'Local Customs', 'Must-See Places']
        : ['Nearby Places', 'Emergency Info', 'Restaurant Tips']
    };
  }

  // Default response
  return {
    text: `I'm here to help${userName ? `, ${userName}` : ''}! I can assist with:\n\n- Trip planning & itineraries\n- Packing advice\n- Local customs & culture\n- Restaurant recommendations\n- Transportation tips\n- Emergency assistance\n\nWhat would you like to know?`,
    type: 'general',
    quickReplies: getContextualQuickReplies(context)
  };
};

/**
 * Get contextual quick replies based on user state
 */
const getContextualQuickReplies = (context) => {
  const { user, currentTrip, tripPhase } = context;

  if (!user) {
    return ['Travel Tips', 'Popular Destinations', 'How to Plan'];
  }

  if (currentTrip) {
    if (tripPhase === 'before') {
      return ['Packing Tips', 'Local Customs', 'Weather Info'];
    } else if (tripPhase === 'during') {
      return ['Emergency Help', 'Nearby Places', 'Restaurant Tips'];
    } else {
      return ['Plan New Trip', 'Share Experience', 'Travel Tips'];
    }
  }

  return ['Plan a Trip', 'My Trips', 'Travel Tips'];
};

export default {
  generateViResponse
};
