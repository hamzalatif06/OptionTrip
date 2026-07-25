/**
 * Notification Service
 * Creates, reads, and generates in-app notifications (trip reminders, service
 * upsells, destination inspiration). Every creation goes through an upsert
 * keyed on {user_id, dedupe_key} — this is the entire idempotency guarantee
 * that makes it safe to run the generator sweeps on a repeating schedule.
 */

import mongoose from 'mongoose';
import OpenAI from 'openai';
import Notification from '../models/Notification.js';
import Trip from '../models/Trip.js';
import UserMemoryProfile from '../models/UserMemoryProfile.js';
import { getRecentActivities } from './userActivityService.js';
import { computeServiceSignals } from './serviceSignalsService.js';

// Trips can belong to "guest" (anonymous checkout) rather than a real User —
// there's no one to notify in that case, and a non-ObjectId user_id would
// otherwise throw a Mongoose CastError deep in the loop below.
const hasNotifiableUser = (userId) => mongoose.Types.ObjectId.isValid(userId);

let openai = null;
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};
const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

const SERVICE_TITLES = {
  esim:  'Sort your data before you fly',
  car:   "Don't forget a rental car",
  hotel: 'Still need a place to stay?',
  tours: 'Tours and activities are ready to book'
};
const SERVICE_CTA_LABELS = {
  esim: 'Browse eSIM plans',
  car: 'Browse rental cars',
  hotel: 'Find a stay',
  tours: 'See tours'
};

// ─── Create / read / update ─────────────────────────────────────────────────

/**
 * Idempotent create: calling this twice with the same {user_id, dedupe_key}
 * is a guaranteed no-op on the second call.
 */
export const createNotification = async ({
  user_id, type, title, body = '', cta = {}, related = {}, dedupe_key, priority = 'normal'
}) => {
  if (!hasNotifiableUser(user_id)) return { created: false }; // e.g. guest-checkout trips have no real user to notify
  try {
    const result = await Notification.findOneAndUpdate(
      { user_id, dedupe_key },
      {
        $setOnInsert: {
          user_id, type, title, body,
          cta: { label: cta.label || null, url: cta.url || null },
          related: { trip_id: related.trip_id || null, destination: related.destination || null },
          dedupe_key, priority
        }
      },
      { upsert: true, new: false, includeResultMetadata: true }
    );
    const created = !result.lastErrorObject?.updatedExisting;
    return { created };
  } catch (err) {
    if (err.code === 11000) return { created: false }; // concurrent sweep beat us to it
    console.error('createNotification error:', err.message);
    return { created: false, error: err.message };
  }
};

export const getNotifications = async (userId, { status, limit = 20 } = {}) => {
  const query = { user_id: userId };
  if (status) query.status = status;
  return Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
};

export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user_id: userId, status: 'unread' });
};

export const markRead = async (userId, ids) => {
  const idList = Array.isArray(ids) ? ids : [ids];
  const res = await Notification.updateMany(
    { user_id: userId, _id: { $in: idList } },
    { $set: { status: 'read' } }
  );
  return res.modifiedCount || 0;
};

export const markAllRead = async (userId) => {
  const res = await Notification.updateMany(
    { user_id: userId, status: 'unread' },
    { $set: { status: 'read' } }
  );
  return res.modifiedCount || 0;
};

export const dismiss = async (userId, id) => {
  const res = await Notification.updateOne(
    { user_id: userId, _id: id },
    { $set: { status: 'dismissed' } }
  );
  return res.modifiedCount || 0;
};

// ─── Generators (called by the shared scheduler) ────────────────────────────

const TRIP_REMINDER_MILESTONES = [7, 3, 1, 0];

/** Trip-starting-soon / trip-just-ended reminders. */
export const generateTripReminders = async () => {
  const now = new Date();
  const trips = await Trip.find({ deleted: { $ne: true }, status: { $ne: 'archived' } })
    .select('trip_id user_id destination dates')
    .lean();

  let created = 0;
  for (const trip of trips) {
    if (!trip.dates?.start_date || !hasNotifiableUser(trip.user_id)) continue;

    try {
      const dest = trip.destination?.name || trip.destination?.text || 'your destination';
      const daysToStart = Math.ceil((new Date(trip.dates.start_date) - now) / 86400000);

      if (TRIP_REMINDER_MILESTONES.includes(daysToStart)) {
        const { created: didCreate } = await createNotification({
          user_id: trip.user_id,
          type: 'trip_reminder',
          title: daysToStart === 0
            ? `Your trip to ${dest} starts today!`
            : `${daysToStart} day${daysToStart === 1 ? '' : 's'} until ${dest}`,
          body: daysToStart === 0
            ? 'Have an amazing trip — safe travels!'
            : `Time to finish prepping for your trip to ${dest}.`,
          cta: { label: 'View trip', url: `/trips/${trip.trip_id}` },
          related: { trip_id: trip.trip_id, destination: dest },
          dedupe_key: `trip_reminder:${trip.trip_id}:${daysToStart}`,
          priority: daysToStart <= 1 ? 'high' : 'normal'
        });
        if (didCreate) created++;
      }

      if (trip.dates?.end_date) {
        const daysSinceEnd = Math.floor((now - new Date(trip.dates.end_date)) / 86400000);
        if (daysSinceEnd === 1) {
          const { created: didCreate } = await createNotification({
            user_id: trip.user_id,
            type: 'trip_reminder',
            title: `How was ${dest}?`,
            body: 'Hope your trip was amazing! Ready to plan the next one?',
            cta: { label: 'Plan a trip', url: '/' },
            related: { trip_id: trip.trip_id, destination: dest },
            dedupe_key: `trip_wrapup:${trip.trip_id}`,
            priority: 'low'
          });
          if (didCreate) created++;
        }
      }
    } catch (err) {
      // One bad trip should never take down the reminders for every other user.
      console.error(`generateTripReminders: trip ${trip.trip_id} failed:`, err.message);
    }
  }
  return created;
};

/** Reuses Phase 1's deterministic service signals across every active/upcoming trip. */
export const generateServiceUpsellNotifications = async () => {
  const trips = await Trip.find({
    deleted: { $ne: true },
    status: { $in: ['option_selected', 'itinerary_generated'] }
  }).lean();

  let created = 0;
  for (const trip of trips) {
    if (!hasNotifiableUser(trip.user_id)) continue;

    try {
      const recentActivities = await getRecentActivities(trip.user_id, 60);
      const signals = computeServiceSignals(null, trip, recentActivities);

      for (const signal of signals) {
        const { created: didCreate } = await createNotification({
          user_id: trip.user_id,
          type: 'service_upsell',
          title: SERVICE_TITLES[signal.service] || 'A quick suggestion for your trip',
          body: signal.reason,
          cta: { label: SERVICE_CTA_LABELS[signal.service] || 'Learn more', url: signal.url },
          related: { trip_id: trip.trip_id, destination: signal.destination },
          dedupe_key: `service_upsell:${trip.trip_id}:${signal.service}`,
          priority: 'normal'
        });
        if (didCreate) created++;
      }
    } catch (err) {
      console.error(`generateServiceUpsellNotifications: trip ${trip.trip_id} failed:`, err.message);
    }
  }
  return created;
};

const getIsoWeekKey = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/**
 * v1 scope: no external news API exists in this repo, so this generates a
 * cheap AI seasonal/inspiration note from the user's own memory-profile
 * interests, throttled to ~1/user/week. Real live news needs a future API key.
 */
export const generateDestinationNewsNotifications = async (limit = 100) => {
  const client = getOpenAIClient();
  if (!client) return 0;

  const weekKey = getIsoWeekKey();
  const profiles = await UserMemoryProfile.find({ 'facts.favorite_destinations.0': { $exists: true } })
    .limit(limit)
    .lean();

  let created = 0;
  for (const profile of profiles) {
    const dedupeKey = `destination_news:${profile.user_id}:${weekKey}`;
    const alreadyExists = await Notification.exists({ user_id: profile.user_id, dedupe_key: dedupeKey });
    if (alreadyExists) continue;

    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [{
          role: 'user',
          content: `Write ONE short, exciting travel inspiration notification (title <=60 chars, body <=200 chars) for a traveler interested in: ${profile.facts.favorite_destinations.join(', ')}. Interests: ${(profile.facts.interests || []).join(', ') || 'general travel'}. Respond ONLY as JSON: {"title": "...", "body": "..."}`
        }],
        temperature: 0.8,
        max_tokens: 150,
        response_format: { type: 'json_object' }
      });
      const parsed = JSON.parse(completion.choices[0].message.content);

      const { created: didCreate } = await createNotification({
        user_id: profile.user_id,
        type: 'destination_news',
        title: (parsed.title || 'New travel inspiration').slice(0, 120),
        body: (parsed.body || '').slice(0, 400),
        cta: { label: 'Explore', url: '/destinations' },
        dedupe_key: dedupeKey,
        priority: 'low'
      });
      if (didCreate) created++;
    } catch (err) {
      console.error('generateDestinationNewsNotifications error:', err.message);
    }
  }
  return created;
};

export default {
  createNotification,
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  dismiss,
  generateTripReminders,
  generateServiceUpsellNotifications,
  generateDestinationNewsNotifications
};
