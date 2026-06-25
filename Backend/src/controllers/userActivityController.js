/**
 * User Activity Controller
 *
 * Two endpoints:
 *   POST /api/activity/log     — record a user action (auth optional; silently
 *                                drops anonymous activity)
 *   GET  /api/activity/context — lightweight summary the ViAssistant uses to
 *                                personalize its opening bubble (auth required)
 */

import {
  logActivity,
  getRecentActivities,
  getUnfedActivities,
  summarizeActivities
} from '../services/userActivityService.js';

export const logActivityHandler = async (req, res) => {
  try {
    // Guests are valid users of the site — we just don't persist their activity.
    if (!req.user?._id) {
      return res.status(200).json({ success: true, skipped: true, reason: 'anonymous' });
    }

    const { type, action, title, metadata, location } = req.body || {};
    if (!type || !action) {
      return res.status(400).json({ success: false, message: 'type and action are required' });
    }

    const activity = await logActivity({
      userId: req.user._id,
      type, action, title, metadata, location
    });

    return res.status(201).json({
      success: true,
      data: activity ? {
        id: activity._id,
        type: activity.type,
        action: activity.action
      } : null
    });
  } catch (err) {
    console.error('logActivityHandler error:', err);
    return res.status(500).json({ success: false, message: 'Failed to log activity' });
  }
};

export const getActivityContext = async (req, res) => {
  try {
    const userId = req.user._id;
    const [recent, unfed] = await Promise.all([
      getRecentActivities(userId, 60),
      getUnfedActivities(userId, 5)
    ]);

    const summary = summarizeActivities(recent);

    return res.status(200).json({
      success: true,
      data: {
        summary,
        hasUnfedActivities: unfed.length > 0,
        unfedCount: unfed.length,
        unfedPreview: unfed.slice(0, 3).map(a => ({
          type: a.type,
          action: a.action,
          title: a.title,
          createdAt: a.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('getActivityContext error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load activity context' });
  }
};

export default { logActivityHandler, getActivityContext };
