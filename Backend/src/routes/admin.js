import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getStats, getUsers, getActivity, deactivateUser } from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats',          getStats);
router.get('/users',          getUsers);
router.get('/activity',       getActivity);
router.delete('/users/:id',   deactivateUser);

export default router;
