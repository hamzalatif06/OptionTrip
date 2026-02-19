/**
 * Chat Routes
 * Handles Vi AI Assistant API endpoints
 */

import express from 'express';
import { sendMessage, getChatHistory, getStatus } from '../controllers/chatController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/chat/message
 * @desc    Send a message to Vi assistant
 * @access  Public (enhanced with user context if authenticated)
 */
router.post('/message', optionalAuthenticate, sendMessage);

/**
 * @route   GET /api/chat/history
 * @desc    Get chat conversation history
 * @access  Private
 */
router.get('/history', authenticate, getChatHistory);

/**
 * @route   GET /api/chat/status
 * @desc    Get Vi assistant status and capabilities
 * @access  Public
 */
router.get('/status', getStatus);

export default router;
