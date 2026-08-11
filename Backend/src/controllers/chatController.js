/**
 * Chat Controller
 * Handles Vi AI Assistant chat endpoints with conversation persistence
 */

import {
  generateViResponse,
  streamViResponse,
  generateViResponseWithTools,
  detectFlightToolCall,
  resolveFlightToolCall
} from '../services/chatService.js';
import Trip from '../models/Trip.js';
import Conversation from '../models/Conversation.js';
import {
  getUnfedActivities,
  getRecentActivities,
  markActivitiesAsFed,
  logActivity
} from '../services/userActivityService.js';
import {
  getOrCreateProfile,
  needsResummarization,
  summarizeUserForMemory,
  markUpsellSuggested,
  wasUpsellSuggestedRecently,
  formatMemoryForPrompt
} from '../services/memoryProfileService.js';
import { computeServiceSignals } from '../services/serviceSignalsService.js';
import { checkFlightToolBudget } from '../middleware/chatToolLimiter.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const generateConversationId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const autoTitle = (text) =>
  text.length > 45 ? text.substring(0, 42).trimEnd() + '...' : text;

/**
 * Log a UserActivity entry when Vi's flight tool actually ran, so
 * serviceSignalsService's "have they searched flights" signal stays accurate
 * whether the search happened on /flights or via chat.
 */
const logFlightToolActivity = (user, response) => {
  if (!user || response?.resultsType !== 'flights') return;
  const params = response.results?.length ? { origin: response.results[0].origin, destination: response.results[0].destination } : {};
  logActivity({
    userId: user._id,
    type: 'flight',
    action: 'searched',
    title: `Vi searched flights: ${params.origin || '?'} → ${params.destination || '?'}`,
    metadata: {
      origin: params.origin,
      destination: params.destination,
      resultCount: response.results?.length || 0,
      providerStatus: response.providerStatus,
      source: 'chat'
    }
  }).catch(err => console.error('Failed to log chat flight search activity:', err.message));
};

/** Infer user travel preferences from their trip history */
const buildPreferences = (trips) => {
  const destinations = [...new Set(trips.map(t => t.destination?.name).filter(Boolean))];
  const tripTypes    = [...new Set(trips.map(t => t.trip_type).filter(Boolean))];
  const budgets      = trips.map(t => t.budget).filter(Boolean);
  const descriptions = trips.map(t => t.description).filter(Boolean);

  // Most common budget
  const budgetCount = budgets.reduce((acc, b) => { acc[b] = (acc[b] || 0) + 1; return acc; }, {});
  const preferredBudget = Object.entries(budgetCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return { destinations, tripTypes, preferredBudget, loveDescriptions: descriptions };
};

/**
 * Shared context+conversation builder for both streaming and non-streaming endpoints.
 * Returns { context, conversation, conversationHistory } where conversation is a Mongoose
 * doc with the user message already appended (or null for anonymous users).
 */
const prepareChat = async (user, { message, tripId, conversationId, location }) => {
  const context = {
    user: user ? { id: user._id, name: user.name, email: user.email } : null,
    currentTrip: null,
    tripPhase: 'planning',
    allTrips: [],
    preferences: null,
    currentLocation: location && (location.city || location.label || (typeof location.lat === 'number' && typeof location.lng === 'number'))
      ? location
      : null,
    recentActivities: [],
    unfedActivityIds: [],
    memoryProfile: '',
    serviceSignals: []
  };

  let conversation = null;
  let conversationHistory = [];

  if (user) {
    try {
      // Fetch user trips — include options + itinerary so Vi can reason about specific days.
      const userTrips = await Trip.find({ user_id: user._id })
        .sort({ createdAt: -1 })
        .select('trip_id destination origin dates trip_type guests budget description options selected_option_id status')
        .limit(15);

      context.allTrips = userTrips;
      context.preferences = buildPreferences(userTrips);

      if (tripId) {
        context.currentTrip = userTrips.find(t => t.trip_id === tripId) || null;
      } else {
        const now = new Date();
        context.currentTrip =
          userTrips.find(t => new Date(t.dates?.end_date) >= now) ||
          userTrips[0] ||
          null;
      }

      if (context.currentTrip?.dates) {
        const now = new Date();
        const start = new Date(context.currentTrip.dates.start_date);
        const end   = new Date(context.currentTrip.dates.end_date);
        context.tripPhase = now < start ? 'before' : now <= end ? 'during' : 'after';
      }
    } catch (tripErr) {
      console.error('Error fetching trips for chat context:', tripErr);
    }

    // Pull recent activities the assistant hasn't been told about yet.
    try {
      const unfed = await getUnfedActivities(user._id, 30);
      if (unfed.length) {
        context.recentActivities = unfed;
        context.unfedActivityIds = unfed.map(a => a._id);
      }
    } catch (actErr) {
      console.error('Error fetching unfed activities:', actErr);
    }

    // Long-term memory profile + proactive service-suggestion signals.
    try {
      const profile = await getOrCreateProfile(user._id);
      context.memoryProfile = formatMemoryForPrompt(profile);

      // Signal detection needs the FULL recent window (fed + unfed) — using
      // only unfed activities would make an already-mentioned service look
      // "never tried" again once its activity row ages into fed status.
      const allRecent = await getRecentActivities(user._id, 60);
      context.serviceSignals = computeServiceSignals(user, context.currentTrip, allRecent)
        .filter(s => !wasUpsellSuggestedRecently(profile, s.service));

      // Optimistic mark: once a signal is handed to the model it's considered
      // "suggested" for cooldown purposes, whether or not Vi actually used it
      // in this particular reply — simplest correct anti-nag behavior.
      context.serviceSignals.forEach(s => {
        markUpsellSuggested(user._id, s.service).catch(() => {});
      });

      // Fire-and-forget re-summarization — never blocks the reply.
      needsResummarization(profile)
        .then(should => {
          if (should) {
            summarizeUserForMemory(user._id).catch(err =>
              console.error('Memory summarization failed:', err.message)
            );
          }
        })
        .catch(() => {});
    } catch (memErr) {
      console.error('Error building memory profile context:', memErr);
    }

    try {
      if (conversationId) {
        conversation = await Conversation.findOne({
          conversation_id: conversationId,
          user_id: String(user._id)
        });
      }
      if (!conversation) {
        conversation = new Conversation({
          conversation_id: generateConversationId(),
          user_id: String(user._id),
          title: autoTitle(message),
          messages: []
        });
      }
      conversation.messages.push({ role: 'user', text: message, type: 'user' });
      conversationHistory = conversation.messages
        .slice(-20)
        .map(m => ({ role: m.role, text: m.text }));
    } catch (convErr) {
      console.error('Error loading conversation:', convErr);
    }
  }

  return { context, conversation, conversationHistory };
};

// ── Main message handler ───────────────────────────────────────────────────

/**
 * POST /api/chat/message
 * Accepts optional conversationId; creates/continues a Conversation doc if authenticated.
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, tripId, conversationId, location } = req.body;
    const user = req.user;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const { context, conversation, conversationHistory } =
      await prepareChat(user, { message, tripId, conversationId, location });

    const budgetKey = user?._id?.toString() || req.ip;
    const response = await generateViResponseWithTools(message, context, conversationHistory, {
      canUseFlightTool: checkFlightToolBudget(budgetKey)
    });

    logFlightToolActivity(user, response);

    if (conversation) {
      try {
        conversation.messages.push({
          role: 'assistant',
          text: response.text,
          type: response.type || 'general',
          quickReplies: response.quickReplies || [],
          results: response.results || undefined,
          resultsType: response.resultsType || undefined,
          providerStatus: response.providerStatus || undefined
        });
        conversation.last_message_at = new Date();
        await conversation.save();
      } catch (saveErr) {
        console.error('Error saving conversation:', saveErr);
      }
    }

    // Mark every activity we just injected so we don't re-feed it next turn.
    if (user && context.unfedActivityIds?.length) {
      markActivitiesAsFed(user._id, context.unfedActivityIds).catch(err =>
        console.error('Failed to mark activities as fed:', err.message)
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        message: response.text,
        type: response.type,
        quickReplies: response.quickReplies,
        results: response.results || null,
        resultsType: response.resultsType || null,
        providerStatus: response.providerStatus || null,
        timestamp: new Date().toISOString(),
        conversationId: conversation?.conversation_id || null
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ── Streaming message handler ──────────────────────────────────────────────

/**
 * POST /api/chat/message/stream
 * SSE endpoint. Sends `data: {delta}` events for each chunk, then a final
 * `data: {done, type, quickReplies, conversationId}` event.
 */
export const streamMessage = async (req, res) => {
  const { message, tripId, conversationId, location } = req.body;
  const user = req.user;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const { context, conversation, conversationHistory } =
      await prepareChat(user, { message, tripId, conversationId, location });

    // Always run the cheap intent-detection pass first — tool-call decisions
    // aren't meaningfully character-streamable the way plain text is.
    const { toolCall, messages: toolMessages } = await detectFlightToolCall(message, context, conversationHistory);

    let responseText, quickReplies, type, results = null, resultsType = null, providerStatus = null;

    if (toolCall) {
      // Flight search triggered — tell the UI, then run the (multi-second,
      // multi-provider) tool + narration non-streamed, and deliver the whole
      // reply as one chunk rather than a character-typed stream.
      send({ status: 'searching_flights' });

      const budgetKey = user?._id?.toString() || req.ip;
      const toolResponse = await resolveFlightToolCall(toolCall, toolMessages, context, {
        canUseFlightTool: checkFlightToolBudget(budgetKey)
      });

      responseText   = toolResponse.text;
      quickReplies   = toolResponse.quickReplies || [];
      type           = toolResponse.type || 'general';
      results        = toolResponse.results || null;
      resultsType    = toolResponse.resultsType || null;
      providerStatus = toolResponse.providerStatus || null;

      logFlightToolActivity(user, toolResponse);

      send({ delta: JSON.stringify({ message: responseText, type, quickReplies }) });
    } else {
      // No tool needed — existing character-streamed path, unchanged.
      const aiStream = await streamViResponse(message, context, conversationHistory);

      if (!aiStream) {
        // No API key — fall back to non-streaming
        const fallback = await generateViResponse(message, context, conversationHistory);
        send({ delta: JSON.stringify({ message: fallback.text, type: fallback.type, quickReplies: fallback.quickReplies }) });
        send({ done: true, type: fallback.type, quickReplies: fallback.quickReplies, conversationId: conversation?.conversation_id || null });
        return res.end();
      }

      let fullText = '';
      for await (const chunk of aiStream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          send({ delta });
        }
      }

      let parsed = {};
      try { parsed = JSON.parse(fullText); } catch { /* noop */ }

      responseText = parsed.message || parsed.text || fullText;
      quickReplies = Array.isArray(parsed.quickReplies) ? parsed.quickReplies.slice(0, 4) : [];
      type = parsed.type || 'general';
    }

    let savedConvId = conversation?.conversation_id || null;
    if (conversation) {
      try {
        conversation.messages.push({
          role: 'assistant',
          text: responseText,
          type,
          quickReplies,
          results: results || undefined,
          resultsType: resultsType || undefined,
          providerStatus: providerStatus || undefined
        });
        conversation.last_message_at = new Date();
        await conversation.save();
        savedConvId = conversation.conversation_id;
      } catch (saveErr) {
        console.error('Error saving streamed conversation:', saveErr);
      }
    }

    if (user && context.unfedActivityIds?.length) {
      markActivitiesAsFed(user._id, context.unfedActivityIds).catch(() => {});
    }

    send({ done: true, type, quickReplies, results, resultsType, providerStatus, conversationId: savedConvId });
  } catch (err) {
    if (err?.name !== 'AbortError') console.error('Stream chat error:', err);
    send({ error: 'Stream failed' });
  }

  res.end();
};

// ── Conversation CRUD ──────────────────────────────────────────────────────

/** POST /api/chat/conversations */
export const createConversation = async (req, res) => {
  try {
    const user = req.user;
    const conversation = new Conversation({
      conversation_id: generateConversationId(),
      user_id: String(user._id),
      title: 'New Conversation',
      messages: []
    });
    await conversation.save();
    return res.status(201).json({
      success: true,
      data: {
        conversation_id: conversation.conversation_id,
        title: conversation.title,
        last_message_at: conversation.last_message_at,
        message_count: 0
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
};

/** GET /api/chat/conversations */
export const getConversations = async (req, res) => {
  try {
    const user = req.user;
    const conversations = await Conversation.find({ user_id: String(user._id) })
      .sort({ last_message_at: -1 })
      .limit(50)
      .select('conversation_id title last_message_at messages');

    const data = conversations
      .filter(c => c.messages.length > 0) // hide empty convos
      .map(c => ({
        conversation_id: c.conversation_id,
        title: c.title,
        last_message_at: c.last_message_at,
        message_count: c.messages.length,
        last_message: c.messages[c.messages.length - 1]?.text?.substring(0, 60) || ''
      }));

    return res.status(200).json({ success: true, data: { conversations: data } });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

/** GET /api/chat/conversations/:conversationId */
export const getConversation = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      conversation_id: conversationId,
      user_id: String(user._id)
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
        conversation_id: conversation.conversation_id,
        title: conversation.title,
        messages: conversation.messages,
        last_message_at: conversation.last_message_at
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch conversation' });
  }
};

/** DELETE /api/chat/conversations/:conversationId */
export const deleteConversation = async (req, res) => {
  try {
    const user = req.user;
    const { conversationId } = req.params;

    const result = await Conversation.deleteOne({
      conversation_id: conversationId,
      user_id: String(user._id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
};

/** GET /api/chat/history — legacy endpoint */
export const getChatHistory = async (req, res) => {
  try {
    const user = req.user;
    const conversations = await Conversation.find({ user_id: String(user._id) })
      .sort({ last_message_at: -1 })
      .limit(1)
      .select('messages');

    const messages = conversations[0]?.messages || [];
    return res.status(200).json({ success: true, data: { messages, hasMore: false } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chat history' });
  }
};

/** GET /api/chat/status */
export const getStatus = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        status: 'online',
        name: 'Vi',
        capabilities: [
          'Trip planning assistance',
          'Packing recommendations',
          'Local customs and culture info',
          'Restaurant recommendations',
          'Transportation tips',
          'Emergency assistance',
          'Weather information',
          'Conversation history'
        ],
        supportedLanguages: ['en'],
        version: '2.0.0'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to get status' });
  }
};

export default { sendMessage, getChatHistory, getStatus, createConversation, getConversations, getConversation, deleteConversation };
