import express from 'express';
import { getYearlyReport, getYearlyReportCard } from '../controllers/yearlyReportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/:year/card.svg', authenticate, getYearlyReportCard);
router.get('/:year', authenticate, getYearlyReport);

export default router;
