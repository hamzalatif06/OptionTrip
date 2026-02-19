/**
 * Chat Controller
 * Handles Vi AI Assistant chat endpoints
 */

import { generateViResponse } from '../services/chatService.js';
import Trip from '../models/Trip.js';

/**
 * Send a message to Vi assistant
 * POST /api/chat/message
 */
export const sendMessage = async (req, res) => {
  try {
    const { message, tripId } = req.body;
    const user = req.user; // May be null if not authenticated

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Build context object
    const context = {
      user: user ? {
        id: user._id,
        name: user.name,
        email: user.email
      } : null,
      currentTrip: null,
      tripPhase: 'planning',
      allTrips: []
    };

    // If user is authenticated, fetch their trips
    if (user) {
      try {
        const userTrips = await Trip.find({ user_id: user._id })
          .sort({ saved_at: -1, createdAt: -1 })
          .select('trip_id destination dates trip_type guests budget')
          .limit(10);

        context.allTrips = userTrips;

        // Find current/upcoming trip or use specific tripId
        if (tripId) {
          const specificTrip = userTrips.find(t => t.trip_id === tripId);
          if (specificTrip) {
            context.currentTrip = specificTrip;
          }
        } else {
          // Find most relevant trip (upcoming or most recent)
          const now = new Date();
          const upcomingTrip = userTrips.find(trip => {
            const endDate = new Date(trip.dates?.end_date);
            return endDate >= now;
          });

          context.currentTrip = upcomingTrip || userTrips[0] || null;
        }

        // Determine trip phase
        if (context.currentTrip?.dates) {
          const today = new Date();
          const startDate = new Date(context.currentTrip.dates.start_date);
          const endDate = new Date(context.currentTrip.dates.end_date);

          if (today < startDate) {
            context.tripPhase = 'before';
          } else if (today >= startDate && today <= endDate) {
            context.tripPhase = 'during';
          } else {
            context.tripPhase = 'after';
          }
        }
      } catch (tripError) {
        console.error('Error fetching user trips for chat context:', tripError);
        // Continue without trip context
      }
    }

    // Generate AI response
    const response = await generateViResponse(message, context);

    return res.status(200).json({
      success: true,
      data: {
        message: response.text,
        type: response.type,
        quickReplies: response.quickReplies,
        timestamp: new Date().toISOString()
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

/**
 * Get chat conversation history (if implementing persistence)
 * GET /api/chat/history
 */
export const getChatHistory = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For now, return empty history (can implement persistence later)
    return res.status(200).json({
      success: true,
      data: {
        messages: [],
        hasMore: false
      }
    });

  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history'
    });
  }
};

/**
 * Get Vi assistant status and capabilities
 * GET /api/chat/status
 */
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
          'Weather information'
        ],
        supportedLanguages: ['en'],
        version: '1.0.0'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get status'
    });
  }
};

export default {
  sendMessage,
  getChatHistory,
  getStatus
};
