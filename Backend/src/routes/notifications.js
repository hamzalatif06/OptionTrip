/**
 * Notification Routes
 */

import express from 'express';
import {
  listNotifications,
  unreadCount,
  markOneRead,
  markAll,
  dismissOne
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, listNotifications);
router.get('/unread-count', authenticate, unreadCount);
router.patch('/:id/read', authenticate, markOneRead);
router.post('/read-all', authenticate, markAll);
router.patch('/:id/dismiss', authenticate, dismissOne);

export default router;
