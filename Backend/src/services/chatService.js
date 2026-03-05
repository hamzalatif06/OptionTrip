/**
 * Chat Service
 * Handles AI-powered chat for Vi Travel Assistant
 */

import OpenAI from 'openai';

let openai = null;

const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

/**
 * Generate AI response for Vi assistant
 * @param {string} userMessage
 * @param {Object} context - user, currentTrip, tripPhase, allTrips, preferences
 * @param {Array}  conversationHistory - [{role, text}, ...] last N messages
 */
export const generateViResponse = async (userMessage, context = {}, conversationHistory = []) => {
  try {
    const client = getOpenAIClient();
    if (!client) {
      return generateFallbackResponse(userMessage, context);
    }

    const systemPrompt = buildSystemPrompt(context);

    // Build messages array: history + current message
    const messages = [{ role: 'system', content: systemPrompt }];

    // Inject prior conversation turns (skip the last one — it's the current user message)
    const historyToInject = conversationHistory.slice(0, -1); // exclude the just-added user msg
    for (const msg of historyToInject) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.text
      });
    }

    // Current user message
    messages.push({ role: 'user', content: buildUserPrompt(userMessage, context) });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
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

const buildSystemPrompt = (context) => {
  const { user, currentTrip, tripPhase, allTrips, preferences } = context;

  let prompt = `You are Vi, a friendly and knowledgeable AI travel assistant for OptionTrip.

YOUR PERSONALITY:
- Warm, helpful, and enthusiastic about travel
- Professional but conversational
- Use occasional travel-related emojis (1-2 per response max)
- Provide practical, actionable advice
- Be concise but informative
- Remember context from earlier in the conversation

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

  if (user) {
    prompt += `\n\nUSER:
- Name: ${user.name || 'User'}
- Saved trips: ${allTrips?.length || 0}`;
  }

  if (preferences) {
    const { destinations, tripTypes, preferredBudget, loveDescriptions } = preferences;
    if (destinations.length > 0 || tripTypes.length > 0 || loveDescriptions.length > 0) {
      prompt += `\n\nUSER PREFERENCES (inferred from past trips):`;
      if (destinations.length > 0)
        prompt += `\n- Past destinations: ${destinations.slice(0, 5).join(', ')}`;
      if (tripTypes.length > 0)
        prompt += `\n- Preferred trip types: ${tripTypes.join(', ')}`;
      if (preferredBudget)
        prompt += `\n- Typical budget: ${preferredBudget}`;
      if (loveDescriptions.length > 0)
        prompt += `\n- Travel interests: ${loveDescriptions.slice(0, 3).map(d => `"${d.substring(0, 80)}"`).join('; ')}`;
    }
  }

  if (currentTrip) {
    prompt += `\n\nCURRENT TRIP:
- Destination: ${currentTrip.destination?.name || 'Unknown'}
- Dates: ${currentTrip.dates?.start_date || 'TBD'} to ${currentTrip.dates?.end_date || 'TBD'}
- Duration: ${currentTrip.dates?.duration_days || 0} days
- Trip Type: ${currentTrip.trip_type || 'Leisure'}
- Travelers: ${currentTrip.guests?.total || 1}
- Budget: ${currentTrip.budget || 'Standard'}
- Phase: ${tripPhase || 'planning'}`;
  }

  return prompt;
};

const buildUserPrompt = (userMessage, context) => {
  const { tripPhase, currentTrip } = context;
  let prompt = `User message: "${userMessage}"`;
  if (tripPhase && currentTrip) {
    const phaseDesc = tripPhase === 'before' ? 'preparing for an upcoming' :
                      tripPhase === 'during' ? 'currently on their' : 'reflecting on their recent';
    prompt += `\n\nContext: User is ${phaseDesc} trip to ${currentTrip.destination?.name || 'their destination'}.`;
  }
  prompt += '\n\nProvide a helpful response in JSON format.';
  return prompt;
};

const generateFallbackResponse = (userMessage, context) => {
  const lowerMessage = userMessage.toLowerCase();
  const { user, currentTrip, tripPhase } = context;
  const userName    = user?.name?.split(' ')[0] || '';
  const destination = currentTrip?.destination?.name || '';

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
    return {
      text: `Hello${userName ? ` ${userName}` : ''}! How can I help you with your travel plans today?`,
      type: 'greeting',
      quickReplies: getContextualQuickReplies(context)
    };
  }

  if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('sos')) {
    return {
      text: `For emergencies:\n- International: 112\n- US: 911 | UK: 999\n\n${destination ? `In ${destination}, note your hotel emergency contact and nearest embassy.` : ''}\n\nHow can I help?`,
      type: 'emergency',
      quickReplies: ['Local Embassy', 'Hospital Info', 'Police Contact']
    };
  }

  if (lowerMessage.includes('pack') || lowerMessage.includes('luggage') || lowerMessage.includes('bring')) {
    const duration = currentTrip?.dates?.duration_days || 5;
    return {
      text: `Packing essentials for your ${duration}-day trip:\n\n- Travel documents & copies\n- Phone charger & adapter\n- Medications\n- ${Math.ceil(duration * 0.7)} tops, ${Math.ceil(duration * 0.5)} bottoms\n- Comfortable walking shoes\n\nNeed destination-specific tips?`,
      type: 'packing',
      quickReplies: ['Weather Info', 'Electronics', 'Toiletries Checklist']
    };
  }

  if (lowerMessage.includes('weather') || lowerMessage.includes('climate')) {
    return {
      text: `For accurate weather${destination ? ` in ${destination}` : ''}, check Weather.com or AccuWeather closer to your trip. Pack layers and a light rain jacket just in case!`,
      type: 'weather',
      quickReplies: ['Packing Tips', 'What to Wear', 'Best Time to Visit']
    };
  }

  if (lowerMessage.includes('restaurant') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
    return {
      text: `For great dining${destination ? ` in ${destination}` : ''}:\n\n- Check TripAdvisor or Google Maps\n- Ask your hotel concierge\n- Look for places busy with locals\n- Try the local specialties!\n\nAny specific cuisine?`,
      type: 'dining',
      quickReplies: ['Local Cuisine', 'Budget Options', 'Fine Dining']
    };
  }

  if (lowerMessage.includes('transport') || lowerMessage.includes('taxi') || lowerMessage.includes('getting around')) {
    return {
      text: `Transportation${destination ? ` in ${destination}` : ''}:\n\n- Ride-sharing (Uber, Lyft, local apps)\n- Public transit (cheapest)\n- Official taxi stands\n- Rental cars for outside city\n\nDownload offline maps before you go!`,
      type: 'transport',
      quickReplies: ['Airport Transfer', 'Public Transit', 'Car Rental']
    };
  }

  if ((lowerMessage.includes('my trip') || lowerMessage.includes('trip detail')) && currentTrip) {
    return {
      text: `Your trip to ${destination}:\n\n- Dates: ${currentTrip.dates?.start_date || 'TBD'} to ${currentTrip.dates?.end_date || 'TBD'}\n- Duration: ${currentTrip.dates?.duration_days || 0} days\n- Travelers: ${currentTrip.guests?.total || 1}\n- Budget: ${currentTrip.budget || 'Standard'}\n\nHow can I help you prepare?`,
      type: 'trip_details',
      quickReplies: tripPhase === 'before'
        ? ['Packing List', 'Local Customs', 'Must-See Places']
        : ['Nearby Places', 'Emergency Info', 'Restaurant Tips']
    };
  }

  return {
    text: `I'm here to help${userName ? `, ${userName}` : ''}! I can assist with:\n\n- Trip planning & itineraries\n- Packing advice\n- Local customs & culture\n- Restaurant recommendations\n- Transportation tips\n- Emergency assistance\n\nWhat would you like to know?`,
    type: 'general',
    quickReplies: getContextualQuickReplies(context)
  };
};

const getContextualQuickReplies = (context) => {
  const { user, currentTrip, tripPhase } = context;
  if (!user) return ['Travel Tips', 'Popular Destinations', 'How to Plan'];
  if (currentTrip) {
    if (tripPhase === 'before') return ['Packing Tips', 'Local Customs', 'Weather Info'];
    if (tripPhase === 'during') return ['Emergency Help', 'Nearby Places', 'Restaurant Tips'];
    return ['Plan New Trip', 'Share Experience', 'Travel Tips'];
  }
  return ['Plan a Trip', 'My Trips', 'Travel Tips'];
};

export default { generateViResponse };
