import cron from "node-cron";
import app from "./app.js";
import { runScheduledSweep } from "./jobs/scheduledSweep.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

if (process.env.ENABLE_IN_PROCESS_CRON !== 'false') {
  cron.schedule('*/20 * * * *', () => {
    runScheduledSweep().catch(err => console.error('In-process sweep failed:', err.message));
  });
  console.log('🕐 In-process sweep scheduled every 20 minutes');
}
