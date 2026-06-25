/**
 * User Activity Service
 * Reads/writes UserActivity docs and shapes them for prompt injection.
 */

import UserActivity from '../models/UserActivity.js';

const MAX_UNFED_TO_INJECT      = 40;
const MAX_FOR_GREETING_SUMMARY = 60;
const MAX_FORMATTED_IN_PROMPT  = 25;

/** Insert a single activity. Returns the doc, or null if anything fails. */
export const logActivity = async ({ userId, type, action, title, metadata, location }) => {
  if (!userId || !type || !action) return null;
  try {
    return await UserActivity.create({
      user_id: userId,
      type,
      action,
      title: title || `${type}:${action}`,
      metadata: metadata || {},
      location: location && (location.city || location.lat) ? location : undefined
    });
  } catch (err) {
    console.error('logActivity error:', err.message);
    return null;
  }
};

/** Recent activities NOT yet fed to the assistant (newest first). */
export const getUnfedActivities = async (userId, limit = MAX_UNFED_TO_INJECT) => {
  if (!userId) return [];
  return UserActivity.find({ user_id: userId, fed_to_assistant: false })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/** All recent activities (fed or not) — used for summary/greeting. */
export const getRecentActivities = async (userId, limit = MAX_FOR_GREETING_SUMMARY) => {
  if (!userId) return [];
  return UserActivity.find({ user_id: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/** Bulk-mark activities as having been fed into the assistant. */
export const markActivitiesAsFed = async (userId, ids = []) => {
  if (!userId || !ids.length) return 0;
  try {
    const res = await UserActivity.updateMany(
      { user_id: userId, _id: { $in: ids } },
      { $set: { fed_to_assistant: true, fed_at: new Date() } }
    );
    return res.modifiedCount || 0;
  } catch (err) {
    console.error('markActivitiesAsFed error:', err.message);
    return 0;
  }
};

/**
 * Derive a lightweight summary the frontend can show in the assistant's
 * opening bubble (interests, recent destinations, last meaningful action).
 */
export const summarizeActivities = (activities = []) => {
  const summary = {
    totalActivities:   activities.length,
    destinations:      [],
    interests:         [],
    recentDestination: null,
    lastAction:        null
  };
  if (!activities.length) return summary;

  const destinations = new Set();
  const interests    = new Set();

  for (const a of activities) {
    const md = a.metadata || {};
    if (md.destination)  destinations.add(md.destination);
    if (md.city)         destinations.add(md.city);
    if (md.vibe)         interests.add(md.vibe);
    if (md.tripType)     interests.add(md.tripType);
    if (md.budget)       interests.add(`${md.budget} budget`);
    if (Array.isArray(md.interests)) {
      md.interests.forEach(i => i && interests.add(i));
    }
  }

  const latest = activities[0];
  summary.destinations      = Array.from(destinations).slice(0, 8);
  summary.interests         = Array.from(interests).slice(0, 8);
  summary.recentDestination = latest?.metadata?.destination || latest?.metadata?.city || null;
  summary.lastAction        = latest
    ? { type: latest.type, action: latest.action, title: latest.title, at: latest.createdAt }
    : null;
  return summary;
};

/**
 * Render activities as compact bullet lines for direct injection into the
 * assistant's system prompt. Caps length to keep tokens bounded.
 */
export const formatActivitiesForPrompt = (activities = []) => {
  if (!activities.length) return '';
  const lines = [];
  for (const a of activities.slice(0, MAX_FORMATTED_IN_PROMPT)) {
    const when = a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : '';
    const md   = a.metadata || {};
    const bits = [];
    if (md.destination)        bits.push(md.destination);
    if (md.origin)             bits.push(`from ${md.origin}`);
    if (md.dates?.start_date)  bits.push(`${md.dates.start_date} → ${md.dates.end_date || '?'}`);
    if (md.duration_days)      bits.push(`${md.duration_days}d`);
    if (md.vibe)               bits.push(`vibe: ${md.vibe}`);
    if (md.budget)             bits.push(`budget: ${md.budget}`);
    if (md.partySize)          bits.push(`party: ${md.partySize}`);
    if (md.tripType)           bits.push(md.tripType);
    if (Array.isArray(md.interests) && md.interests.length) {
      bits.push(`interests: ${md.interests.slice(0, 4).join(', ')}`);
    }
    const detail = bits.length ? ` — ${bits.join(', ')}` : '';
    lines.push(`- [${when}] ${a.title}${detail}`);
  }
  return lines.join('\n');
};

export default {
  logActivity,
  getUnfedActivities,
  getRecentActivities,
  markActivitiesAsFed,
  summarizeActivities,
  formatActivitiesForPrompt
};
