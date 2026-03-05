/**
 * Chat Routes
 * Handles Vi AI Assistant API endpoints
 */

import express from 'express';
import {
  sendMessage,
  getChatHistory,
  getStatus,
  createConversation,
  getConversations,
  getConversation,
  deleteConversation
} from '../controllers/chatController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/chat/message
 * @desc    Send a message to Vi assistant (saves to DB if authenticated)
 * @access  Public (enhanced with user context if authenticated)
 */
router.post('/message', optionalAuthenticate, sendMessage);

/**
 * @route   GET /api/chat/history
 * @desc    Legacy history endpoint
 * @access  Private
 */
router.get('/history', authenticate, getChatHistory);

/**
 * @route   GET /api/chat/status
 * @desc    Get Vi assistant status and capabilities
 * @access  Public
 */
router.get('/status', getStatus);

/**
 * Conversation management routes
 */
router.post('/conversations', authenticate, createConversation);
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:conversationId', authenticate, getConversation);
router.delete('/conversations/:conversationId', authenticate, deleteConversation);

export default router;
