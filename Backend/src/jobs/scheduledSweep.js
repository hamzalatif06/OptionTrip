import { sweepStaleProfiles } from '../services/memoryProfileService.js';
import {
  generateTripReminders,
  generateServiceUpsellNotifications,
  generateDestinationNewsNotifications,
  generateYearlyReportNotifications
} from '../services/notificationService.js';
import { updateTripTravelStatuses } from '../services/tripLifecycleService.js';

export const runScheduledSweep = async () => {
  const results = {};

  try {
    const { activated, completed, visitedLocationsCreated } = await updateTripTravelStatuses();
    results.tripsActivated = activated;
    results.tripsCompleted = completed;
    results.visitedLocationsCreated = visitedLocationsCreated;
  } catch (err) {
    console.error('scheduledSweep: trip travel-status update failed:', err.message);
    results.tripsActivated = 0;
    results.tripsCompleted = 0;
    results.visitedLocationsCreated = 0;
  }

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

  try {
    results.yearlyReportNotifications = await generateYearlyReportNotifications();
  } catch (err) {
    console.error('scheduledSweep: yearly report notifications failed:', err.message);
    results.yearlyReportNotifications = 0;
  }

  return results;
};

export default { runScheduledSweep };
