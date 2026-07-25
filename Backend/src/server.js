import cron from "node-cron";
import app from "./app.js";
import { runScheduledSweep } from "./jobs/scheduledSweep.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// In-process fallback for the notification/memory sweep. Redundant with the
// external POST /api/internal/cron/run-sweep path (which is hosting-agnostic
// and should be treated as the load-bearing one) — cheap to disable if this
// process isn't kept alive 24/7 by the deploy target.
if (process.env.ENABLE_IN_PROCESS_CRON !== 'false') {
  cron.schedule('*/20 * * * *', () => {
    runScheduledSweep().catch(err => console.error('In-process sweep failed:', err.message));
  });
  console.log('🕐 In-process sweep scheduled every 20 minutes');
}
