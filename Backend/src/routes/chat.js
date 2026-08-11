import express from 'express';
import {
  sendMessage,
  streamMessage,
  getChatHistory,
  getStatus,
  createConversation,
  getConversations,
  getConversation,
  deleteConversation
} from '../controllers/chatController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/message', optionalAuthenticate, sendMessage);
router.post('/message/stream', optionalAuthenticate, streamMessage);

router.get('/history', authenticate, getChatHistory);

router.get('/status', getStatus);

router.post('/conversations', authenticate, createConversation);
router.get('/conversations', authenticate, getConversations);
router.get('/conversations/:conversationId', authenticate, getConversation);
router.delete('/conversations/:conversationId', authenticate, deleteConversation);

export default router;
