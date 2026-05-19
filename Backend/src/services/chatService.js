/**
 * Chat Service
 * Powers the Vi AI Travel Assistant.
 *
 * Single response mode: `generateViResponse` returns the full reply + quickReplies
 * + reply type. We use OpenAI JSON mode so the response is structured.
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

// ─── Prompt builders ─────────────────────────────────────────────────────────

const formatItineraryForPrompt = (trip) => {
  if (!trip?.options?.length) return '';
  const selectedId = trip.selected_option_id;
  const opt =
    (selectedId && trip.options.find(o => o.option_id === selectedId)) ||
    trip.options.find(o => o.itinerary_generated && o.itinerary?.length) ||
    null;
  if (!opt?.itinerary?.length) return '';

  const lines = [`\nSELECTED ITINERARY (${opt.title}, ${opt.total_days} days, est. $${opt.estimated_total_cost || '—'}):`];
  for (const day of opt.itinerary) {
    lines.push(`\nDay ${day.day_number} — ${day.title}${day.date ? ` (${day.date})` : ''}`);
    if (day.summary) lines.push(`  ${day.summary}`);
    for (const act of (day.activities || []).slice(0, 8)) {
      const cost = act.cost ? ` ($${act.cost})` : '';
      lines.push(`  • ${act.time} — ${act.title} @ ${act.place_name}${cost}`);
    }
  }
  return lines.join('\n');
};

const buildSystemPrompt = (context) => {
  const { user, currentTrip, tripPhase, allTrips, preferences } = context;

  let prompt = `You are Vi — an expert AI travel assistant for OptionTrip, a trip-planning, flight, hotel, and activity booking platform.

# Identity & Personality
- Warm, friendly, and genuinely enthusiastic about travel.
- Speak like a savvy, well-traveled friend, not a brochure.
- Be confident and decisive. Give specific recommendations, not "you could consider X or Y or Z".
- Use light emojis sparingly — at most 1-2 per reply, only when they add warmth.
- Never be condescending; never apologize for things outside your control.

# What you can help with
- Trip planning, itinerary refinement, day-by-day suggestions
- Destination knowledge: neighborhoods, when-to-visit, must-do experiences, hidden gems
- Practical: packing, visa & docs, currency, transit, SIM/eSIM, tipping, etiquette, safety
- Restaurant, café, and bar recommendations by neighborhood and vibe
- Flight & hotel guidance (search tactics, booking timing, loyalty tips) — point to OptionTrip's tools where relevant
- On-trip help: directions, nearby places, weather expectations, emergencies

# Formatting rules (apply inside the "message" field of the JSON output)
- Use clean Markdown: short paragraphs, **bold** for key terms, bullet points (\`-\`) and numbered lists where they help scanability.
- Headings (\`###\`) only when the answer has clearly distinct sections.
- Inline links allowed: \`[label](url)\`. Do not invent URLs you aren't sure of — prefer naming the source.
- Keep replies tight: under ~180 words unless the user explicitly asks for depth.
- Never wrap the whole reply in a code block. Code blocks are only for code/data.

# Style of advice
- Prefer concrete: "Stay in Le Marais, walk to dinner at Breizh Café" over "There are many great areas".
- When the user has a trip on file, anchor advice to their actual destination, dates, party size, and budget.
- When they have a generated itinerary, reference specific days by number and named activities.
- If a date- or price-sensitive fact would be guessed, say "check live" and tell them what to search for.
- For emergencies, lead with: International 112 (works in EU + most countries), then US 911 / UK 999.

# Boundaries
- Do not invent prices, schedules, availability, or facts about specific businesses you don't know.
- If asked something genuinely ambiguous, ask one short clarifying question.
- Never claim you booked or can book anything — booking happens in the OptionTrip UI.

# Output format
Respond ONLY with valid JSON, no surrounding prose, in this exact shape:
{
  "message": "<your markdown reply>",
  "type": "greeting|info|emergency|planning|trip_details|recommendation|general",
  "quickReplies": ["short follow-up 1", "short follow-up 2", "short follow-up 3"]
}
- 2-4 quickReplies, each ≤ 28 chars, tailored to the reply and the user's trip phase.`;

  // ─── User context
  if (user) {
    prompt += `\n\n# User\n- Name: ${user.name || 'Guest'}\n- Saved trips: ${allTrips?.length || 0}`;
  } else {
    prompt += `\n\n# User\n- Guest user (not signed in). Be welcoming; suggest signing in to unlock saved-trip features.`;
  }

  // ─── Inferred preferences
  if (preferences) {
    const { destinations, tripTypes, preferredBudget, loveDescriptions } = preferences;
    const bits = [];
    if (destinations?.length) bits.push(`- Past destinations: ${destinations.slice(0, 6).join(', ')}`);
    if (tripTypes?.length)    bits.push(`- Trip styles enjoyed: ${tripTypes.join(', ')}`);
    if (preferredBudget)      bits.push(`- Typical budget tier: ${preferredBudget}`);
    if (loveDescriptions?.length) {
      const sample = loveDescriptions.slice(0, 2).map(d => `"${d.substring(0, 90)}"`).join('; ');
      bits.push(`- Stated interests: ${sample}`);
    }
    if (bits.length) prompt += `\n\n# Inferred preferences (from history)\n${bits.join('\n')}`;
  }

  // ─── Current trip
  if (currentTrip) {
    const dest = currentTrip.destination?.name || currentTrip.destination?.text || 'Unknown';
    const origin = currentTrip.origin?.name || currentTrip.origin?.text || null;
    prompt += `\n\n# Current trip in focus\n- Destination: ${dest}`;
    if (origin) prompt += `\n- Origin: ${origin}`;
    prompt += `\n- Dates: ${currentTrip.dates?.start_date || 'TBD'} → ${currentTrip.dates?.end_date || 'TBD'} (${currentTrip.dates?.duration_days || 0} days)`;
    if (currentTrip.guests?.label) prompt += `\n- Travelers: ${currentTrip.guests.label}`;
    else if (currentTrip.guests?.total) prompt += `\n- Travelers: ${currentTrip.guests.total}`;
    if (currentTrip.trip_type) prompt += `\n- Trip style: ${currentTrip.trip_type}`;
    if (currentTrip.budget) prompt += `\n- Budget tier: ${currentTrip.budget}`;
    prompt += `\n- Phase: **${tripPhase || 'planning'}** — `;
    prompt += tripPhase === 'before'
      ? 'pre-trip; focus on prep, anticipation, last-minute tweaks.'
      : tripPhase === 'during'
      ? 'on-trip right now; be brief, useful, on-the-ground (logistics, nearby spots, opening hours guidance).'
      : tripPhase === 'after'
      ? 'post-trip; reflect, capture memories, suggest the next adventure.'
      : 'planning; help shape the trip.';

    const itinSection = formatItineraryForPrompt(currentTrip);
    if (itinSection) prompt += `\n${itinSection}`;
  } else if (allTrips?.length) {
    prompt += `\n\n# Current trip in focus\nNone selected. The user has ${allTrips.length} saved trip(s) — ask which one they want help with, or treat the message as general travel advice.`;
  }

  return prompt;
};

const buildUserPrompt = (userMessage, context) => {
  const { tripPhase, currentTrip } = context;
  let prompt = userMessage;
  if (tripPhase && currentTrip?.destination?.name) {
    prompt = `[Context: user is in the "${tripPhase}" phase of their trip to ${currentTrip.destination.name}]\n\n${prompt}`;
  }
  return prompt;
};

const buildMessages = (userMessage, context, conversationHistory) => {
  const messages = [{ role: 'system', content: buildSystemPrompt(context) }];

  // Inject prior turns (exclude the just-pushed user message — we add it last with extra context)
  const history = conversationHistory.slice(0, -1).slice(-20);
  for (const m of history) {
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.text
    });
  }

  messages.push({ role: 'user', content: buildUserPrompt(userMessage, context) });
  return messages;
};

// ─── Main response generator ────────────────────────────────────────────────

export const generateViResponse = async (userMessage, context = {}, conversationHistory = []) => {
  try {
    const client = getOpenAIClient();
    if (!client) return generateFallbackResponse(userMessage, context);

    const messages = buildMessages(userMessage, context, conversationHistory);

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.75,
      max_tokens: 700,
      response_format: { type: 'json_object' }
    });

    let parsed;
    try {
      parsed = JSON.parse(completion.choices[0].message.content);
    } catch {
      return generateFallbackResponse(userMessage, context);
    }

    return {
      text: parsed.message || parsed.text || "I'm here to help with your travel plans!",
      type: parsed.type || 'general',
      quickReplies: Array.isArray(parsed.quickReplies) && parsed.quickReplies.length
        ? parsed.quickReplies.slice(0, 4)
        : getContextualQuickReplies(context)
    };
  } catch (err) {
    console.error('Vi chat error:', err);
    return generateFallbackResponse(userMessage, context);
  }
};

// ─── Fallback (offline / no API key) ─────────────────────────────────────────

const generateFallbackResponse = (userMessage, context) => {
  const lower = (userMessage || '').toLowerCase();
  const { user, currentTrip, tripPhase } = context;
  const userName = user?.name?.split(' ')[0] || '';
  const dest     = currentTrip?.destination?.name || '';

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/i.test(lower)) {
    return {
      text: `Hi${userName ? ` ${userName}` : ''}! 👋 How can I help with your travel plans today?`,
      type: 'greeting',
      quickReplies: getContextualQuickReplies(context)
    };
  }

  if (/(emergency|sos|urgent|help me)/.test(lower)) {
    return {
      text: `**Emergency numbers**\n- International: **112**\n- US: 911 · UK: 999 · AU: 000\n\n${dest ? `In ${dest}, save your hotel front desk and nearest embassy contact in your phone.` : ''}\n\nWhat happened — can I help you find a hospital, embassy, or police?`,
      type: 'emergency',
      quickReplies: ['Nearest embassy', 'Hospital info', 'Lost passport', 'Local police']
    };
  }

  if (/(pack|luggage|bring|suitcase)/.test(lower)) {
    const d = currentTrip?.dates?.duration_days || 5;
    return {
      text: `Here's a tight ${d}-day packing list${dest ? ` for ${dest}` : ''}:\n\n- Travel docs + photocopies + 2 backup payment cards\n- Phone, charger, **universal adapter**, power bank\n- Medications + small first-aid kit\n- ${Math.ceil(d * 0.7)} tops, ${Math.ceil(d * 0.5)} bottoms, 1 layer, 1 rain shell\n- Comfortable walking shoes + 1 nicer pair\n\nWant a destination-specific tweak?`,
      type: 'packing',
      quickReplies: ['Weather in ' + (dest || 'destination'), 'Electronics list', 'What to wear', 'Toiletries']
    };
  }

  if (/(weather|climate|forecast)/.test(lower)) {
    return {
      text: `For accurate forecasts${dest ? ` in ${dest}` : ''}, check **Weather.com** or **AccuWeather** a few days before you travel — long-range forecasts drift a lot.\n\nGeneral rule: pack one layer warmer than you think and a light rain shell.`,
      type: 'weather',
      quickReplies: ['Packing tips', 'Best time to visit', 'What to wear']
    };
  }

  if (/(restaurant|food|eat|cuisine|dinner)/.test(lower)) {
    return {
      text: `Quick way to eat well${dest ? ` in ${dest}` : ''}:\n\n- Search **Google Maps** with "open now" + rating 4.5+ filter\n- Ask your hotel concierge for two picks — pick the smaller one\n- Skip anywhere with a host on the street pulling people in\n- Lunch menus are usually a steal at fine-dining spots\n\nWhat kind of vibe — casual local, romantic, or splurge?`,
      type: 'recommendation',
      quickReplies: ['Local favorites', 'Budget eats', 'Romantic dinner', 'Brunch spots']
    };
  }

  if (/(transport|taxi|getting around|metro|subway|uber)/.test(lower)) {
    return {
      text: `Getting around${dest ? ` ${dest}` : ''}:\n\n- **Public transit** is almost always fastest in cities — grab a day pass\n- **Uber/Bolt/Grab** for late nights or with luggage\n- Avoid airport taxi touts — use the official rank or pre-booked transfer\n- Download offline maps before you land\n\nFlying in soon?`,
      type: 'transport',
      quickReplies: ['Airport transfer', 'Day pass info', 'Car rental tips']
    };
  }

  if (/(my trip|trip detail|itinerary|where am i going)/.test(lower) && currentTrip) {
    return {
      text: `**Your trip to ${dest}**\n- Dates: ${currentTrip.dates?.start_date || 'TBD'} → ${currentTrip.dates?.end_date || 'TBD'}\n- Duration: ${currentTrip.dates?.duration_days || 0} days\n- Travelers: ${currentTrip.guests?.total || 1}\n- Budget: ${currentTrip.budget || 'Standard'}\n\nHow can I help you prep?`,
      type: 'trip_details',
      quickReplies: tripPhase === 'before'
        ? ['Packing list', 'Local customs', 'Top experiences', 'Visa info']
        : ['Nearby places', 'Emergency info', 'Restaurant tips', 'Transport']
    };
  }

  return {
    text: `Happy to help${userName ? `, ${userName}` : ''}! I can do:\n\n- **Plan** itineraries day-by-day\n- **Pack** lists tailored to your trip\n- **Recommend** restaurants, neighborhoods, activities\n- **Prep** for visas, customs, currency, transit\n- **Help on-trip** with directions, nearby spots, emergencies\n\nWhat are you working on?`,
    type: 'general',
    quickReplies: getContextualQuickReplies(context)
  };
};

const getContextualQuickReplies = (context) => {
  const { user, currentTrip, tripPhase } = context;
  if (!user) return ['Travel tips', 'Popular destinations', 'How to plan'];
  if (currentTrip) {
    if (tripPhase === 'before') return ['Packing list', 'Local customs', 'Top experiences', 'Visa info'];
    if (tripPhase === 'during') return ['Nearby places', 'Restaurant tips', 'Emergency help', 'Transport'];
    return ['Plan a new trip', 'Share experience', 'Travel tips'];
  }
  return ['Plan a trip', 'My trips', 'Travel tips', 'Inspire me'];
};

export default { generateViResponse };
