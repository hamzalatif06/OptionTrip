/**
 * Internal cron routes — machine-to-machine only (see middleware/cronAuth.js).
 * Point an external scheduler (GitHub Actions cron workflow, hosted cron
 * service, platform cron add-on) at POST /api/internal/cron/run-sweep.
 */

import express from 'express';
import { verifyCronSecret } from '../middleware/cronAuth.js';
import { runScheduledSweep } from '../jobs/scheduledSweep.js';

const router = express.Router();

router.post('/run-sweep', verifyCronSecret, async (req, res) => {
  try {
    const results = await runScheduledSweep();
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('run-sweep error:', err);
    return res.status(500).json({ success: false, message: 'Sweep failed' });
  }
});

export default router;
