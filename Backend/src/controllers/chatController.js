/**
 * Chat Controller
 * Handles Vi AI Assistant chat endpoints with conversation persistence
 */

import { generateViResponse } from '../services/chatService.js';
import Trip from '../models/Trip.js';
import Conversation from '../models/Conversation.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const generateConversationId = () =>
  `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const autoTitle = (text) =>
  text.length > 45 ? text.substring(0, 42).trimEnd() + '...' : text;

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

// ── Main message handler ───────────────────────────────────────────────────

/**
 * POST /api/chat/message
 * Accepts optional conversationId; creates/continues a Conversation doc if authenticated.
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, tripId, conversationId } = req.body;
    const user = req.user;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // ── Build context ────────────────────────────────────────────────────
    const context = {
      user: user ? { id: user._id, name: user.name, email: user.email } : null,
      currentTrip: null,
      tripPhase: 'planning',
      allTrips: [],
      preferences: null
    };

    let conversation = null;
    let conversationHistory = [];

    if (user) {
      // Fetch user trips
      try {
        const userTrips = await Trip.find({ user_id: user._id })
          .sort({ createdAt: -1 })
          .select('trip_id destination dates trip_type guests budget description')
          .limit(15);

        context.allTrips = userTrips;
        context.preferences = buildPreferences(userTrips);

        // Resolve currentTrip
        if (tripId) {
          context.currentTrip = userTrips.find(t => t.trip_id === tripId) || null;
        } else {
          const now = new Date();
          context.currentTrip = userTrips.find(t => new Date(t.dates?.end_date) >= now) || userTrips[0] || null;
        }

        // Trip phase
        if (context.currentTrip?.dates) {
          const now = new Date();
          const start = new Date(context.currentTrip.dates.start_date);
          const end   = new Date(context.currentTrip.dates.end_date);
          context.tripPhase = now < start ? 'before' : now <= end ? 'during' : 'after';
        }
      } catch (tripErr) {
        console.error('Error fetching trips for chat context:', tripErr);
      }

      // ── Load or create conversation ──────────────────────────────────
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

        // Append user message
        conversation.messages.push({ role: 'user', text: message, type: 'user' });

        // Build history for AI (last 10 exchanges = 20 messages)
        conversationHistory = conversation.messages
          .slice(-20)
          .map(m => ({ role: m.role, text: m.text }));

      } catch (convErr) {
        console.error('Error loading conversation:', convErr);
      }
    }

    // ── Generate AI response ─────────────────────────────────────────────
    const response = await generateViResponse(message, context, conversationHistory);

    // ── Save bot response to conversation ────────────────────────────────
    if (conversation) {
      try {
        conversation.messages.push({
          role: 'assistant',
          text: response.text,
          type: response.type || 'general',
          quickReplies: response.quickReplies || []
        });
        conversation.last_message_at = new Date();
        await conversation.save();
      } catch (saveErr) {
        console.error('Error saving conversation:', saveErr);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        message: response.text,
        type: response.type,
        quickReplies: response.quickReplies,
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
