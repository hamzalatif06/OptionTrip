import { sweepStaleProfiles } from '../services/memoryProfileService.js';
import {
  generateTripReminders,
  generateServiceUpsellNotifications,
  generateDestinationNewsNotifications
} from '../services/notificationService.js';

export const runScheduledSweep = async () => {
  const results = {};

  try {
    results.memoryProfilesSummarized = await sweepStaleProfiles();
  } catch (err) {
    console.error('scheduledSweep: memory profile sweep failed:', err.message);
    results.memoryProfilesSummarized = 0;
  }

  try {
    results.tripReminders = await generateTripReminders();
  } catch (err) {
    console.error('scheduledSweep: trip reminders failed:', err.message);
    results.tripReminders = 0;
  }

  try {
    results.serviceUpsells = await generateServiceUpsellNotifications();
  } catch (err) {
    console.error('scheduledSweep: service upsells failed:', err.message);
    results.serviceUpsells = 0;
  }

  try {
    results.destinationNews = await generateDestinationNewsNotifications();
  } catch (err) {
    console.error('scheduledSweep: destination news failed:', err.message);
    results.destinationNews = 0;
  }

  return results;
};

export default { runScheduledSweep };
