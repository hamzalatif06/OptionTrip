/**
 * Memory Profile Service
 * Maintains each user's UserMemoryProfile — a small, incrementally-updated
 * "what Vi knows about you" record, distinct from the raw UserActivity/Trip
 * history (which is only ever fed in recent-window slices, see chatService.js).
 *
 * The whole point of this service is to keep the cost of "remembering"
 * flat as a user's history grows: summarizeUserForMemory only ever looks at
 * the delta since the last summarization, folding it into the existing
 * summary rather than recomputing from a user's entire lifetime of data.
 */

import OpenAI from 'openai';
import UserMemoryProfile from '../models/UserMemoryProfile.js';
import Trip from '../models/Trip.js';
import { getRecentActivities } from './userActivityService.js';

let openai = null;
const getOpenAIClient = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

// Gate thresholds — tuned to keep re-summarization rare and cheap.
const RESUMMARIZE_MIN_HOURS = 6;
const RESUMMARIZE_MIN_NEW_ACTIVITIES = 8;
const UPSELL_COOLDOWN_DAYS_DEFAULT = 3;

/** Fetch a user's memory profile, creating an empty one on first use. */
export const getOrCreateProfile = async (userId) => {
  let profile = await UserMemoryProfile.findOne({ user_id: userId });
  if (!profile) {
    profile = await UserMemoryProfile.create({ user_id: userId });
  }
  return profile;
};

/**
 * Should we re-summarize this user right now? Cheap, synchronous check —
 * this gate is what keeps the OpenAI summarization call rare instead of
 * running on every chat turn.
 */
export const needsResummarization = async (profile) => {
  const { lastSummarizedAt } = profile.stats || {};
  if (!lastSummarizedAt) return true;

  const hoursSince = (Date.now() - new Date(lastSummarizedAt).getTime()) / 36e5;
  if (hoursSince < RESUMMARIZE_MIN_HOURS) return false;

  const cursorDate = profile.stats.lastConversationCursor || new Date(0);
  const recentActivities = await getRecentActivities(profile.user_id, 60);
  const newActivityCount = recentActivities.filter(a => new Date(a.createdAt) > cursorDate).length;

  if (newActivityCount >= RESUMMARIZE_MIN_NEW_ACTIVITIES) return true;

  const flippedTrip = await Trip.exists({
    user_id: String(profile.user_id),
    status: { $in: ['booked_externally', 'archived'] },
    updatedAt: { $gt: lastSummarizedAt }
  });
  return !!flippedTrip;
};

const buildSummarizationPrompt = ({ previousSummary, previousFacts, deltaActivities, deltaTrips }) => `You maintain a compact long-term memory profile for a travel app user. Merge the NEW information below into the EXISTING profile. Keep the summary under 1500 characters, written in plain third-person prose Vi (the assistant) can silently reference. Don't repeat facts verbatim across summary and facts — the summary is the narrative, facts are structured lookups.

EXISTING SUMMARY:
${previousSummary || '(none yet — this is the first summarization)'}

EXISTING FACTS:
${JSON.stringify(previousFacts || {}, null, 0)}

NEW ACTIVITY SINCE LAST UPDATE:
${deltaActivities.map(a => `- [${a.type}/${a.action}] ${a.title}${a.metadata?.destination ? ` (${a.metadata.destination})` : ''}`).join('\n') || '(none)'}

NEW/UPDATED TRIPS SINCE LAST UPDATE:
${deltaTrips.map(t => `- ${t.destination?.name || t.destination?.text || 'Unknown'} — ${t.trip_type || 'trip'}, budget: ${t.budget || 'n/a'}, status: ${t.status}`).join('\n') || '(none)'}

Respond ONLY with JSON in this exact shape:
{
  "summary": "<updated narrative, <=1500 chars>",
  "facts": {
    "home_base": "<string or null>",
    "favorite_destinations": ["..."],
    "avoided_or_disliked": ["..."],
    "trip_types": ["..."],
    "typical_budget": "<string or null>",
    "typical_party_size": <number or null>,
    "interests": ["..."],
    "dietary": ["..."],
    "notable_quotes": ["<=3 short memorable quotes/facts, or []"]
  }
}`;

/**
 * Fold the delta since the last summarization into the profile. Safe to call
 * concurrently for the same user (last-write-wins on the profile doc);
 * callers should still gate with needsResummarization to avoid waste.
 */
export const summarizeUserForMemory = async (userId) => {
  const client = getOpenAIClient();
  const profile = await getOrCreateProfile(userId);
  if (!client) return profile; // no API key configured — leave profile as-is

  const recentActivities = await getRecentActivities(userId, 60);
  const cursorDate = profile.stats.lastConversationCursor || new Date(0);
  const deltaActivities = recentActivities.filter(a => new Date(a.createdAt) > cursorDate);

  const trips = await Trip.find({ user_id: String(userId), deleted: { $ne: true } })
    .sort({ updatedAt: -1 })
    .limit(30)
    .select('destination trip_type budget status updatedAt')
    .lean();
  const deltaTrips = trips.filter(t => new Date(t.updatedAt) > cursorDate);

  if (!deltaActivities.length && !deltaTrips.length && profile.stats.lastSummarizedAt) {
    return profile; // nothing new to fold in
  }

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [{
        role: 'user',
        content: buildSummarizationPrompt({
          previousSummary: profile.summary,
          previousFacts: profile.facts,
          deltaActivities,
          deltaTrips
        })
      }],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    return applyMemoryUpdate(userId, {
      summary: parsed.summary,
      facts: parsed.facts,
      newestActivityId: recentActivities[0]?._id || profile.stats.lastActivityCursor,
      totalTripsSeen: trips.length,
      totalActivitiesSeen: recentActivities.length
    });
  } catch (err) {
    console.error('summarizeUserForMemory error:', err.message);
    return profile;
  }
};

/** Persist a completed summarization result and advance the cursors. */
export const applyMemoryUpdate = async (userId, { summary, facts, newestActivityId, totalTripsSeen, totalActivitiesSeen }) => {
  const now = new Date();
  return UserMemoryProfile.findOneAndUpdate(
    { user_id: userId },
    {
      $set: {
        summary: (summary || '').slice(0, 1500),
        'facts.home_base': facts?.home_base ?? null,
        'facts.favorite_destinations': facts?.favorite_destinations || [],
        'facts.avoided_or_disliked': facts?.avoided_or_disliked || [],
        'facts.trip_types': facts?.trip_types || [],
        'facts.typical_budget': facts?.typical_budget ?? null,
        'facts.typical_party_size': facts?.typical_party_size ?? null,
        'facts.interests': facts?.interests || [],
        'facts.dietary': facts?.dietary || [],
        'facts.notable_quotes': (facts?.notable_quotes || []).slice(0, 3),
        'stats.lastSummarizedAt': now,
        'stats.lastActivityCursor': newestActivityId || null,
        'stats.lastConversationCursor': now,
        'stats.totalTripsSeen': totalTripsSeen || 0,
        'stats.totalActivitiesSeen': totalActivitiesSeen || 0
      }
    },
    { new: true, upsert: true }
  );
};

/** Record that Vi (or a notification) just nudged the user about a service. */
export const markUpsellSuggested = async (userId, type) => {
  if (!['esim', 'car', 'hotel', 'tours'].includes(type)) return;
  await UserMemoryProfile.findOneAndUpdate(
    { user_id: userId },
    { $set: { [`facts.upsell_suggested_at.${type}`]: new Date() } },
    { upsert: true }
  );
};

/** Was this service already suggested within the cooldown window? */
export const wasUpsellSuggestedRecently = (profile, type, withinDays = UPSELL_COOLDOWN_DAYS_DEFAULT) => {
  const at = profile?.facts?.upsell_suggested_at?.[type];
  if (!at) return false;
  const daysSince = (Date.now() - new Date(at).getTime()) / 86400000;
  return daysSince < withinDays;
};

/** Render the profile as a compact block for direct system-prompt injection. */
export const formatMemoryForPrompt = (profile) => {
  if (!profile || (!profile.summary && !profile.facts?.favorite_destinations?.length)) return '';

  const lines = [];
  if (profile.summary) lines.push(profile.summary);

  const f = profile.facts || {};
  const bits = [];
  if (f.home_base) bits.push(`Home base: ${f.home_base}`);
  if (f.favorite_destinations?.length) bits.push(`Favorite destinations: ${f.favorite_destinations.join(', ')}`);
  if (f.trip_types?.length) bits.push(`Trip styles: ${f.trip_types.join(', ')}`);
  if (f.typical_budget) bits.push(`Typical budget: ${f.typical_budget}`);
  if (f.interests?.length) bits.push(`Interests: ${f.interests.join(', ')}`);
  if (f.avoided_or_disliked?.length) bits.push(`Dislikes/avoids: ${f.avoided_or_disliked.join(', ')}`);
  if (f.dietary?.length) bits.push(`Dietary: ${f.dietary.join(', ')}`);
  if (bits.length) lines.push(bits.join(' | '));

  return lines.join('\n');
};

/** Batch sweep for the shared scheduler (Phase 2) — re-summarizes stale profiles. */
export const sweepStaleProfiles = async (limit = 200) => {
  const candidates = await UserMemoryProfile.find({
    $or: [
      { 'stats.lastSummarizedAt': null },
      { 'stats.lastSummarizedAt': { $lt: new Date(Date.now() - RESUMMARIZE_MIN_HOURS * 3600000) } }
    ]
  }).limit(limit).lean();

  let updated = 0;
  for (const candidate of candidates) {
    const profile = await UserMemoryProfile.findById(candidate._id);
    if (await needsResummarization(profile)) {
      await summarizeUserForMemory(profile.user_id);
      updated++;
    }
  }
  return updated;
};

export default {
  getOrCreateProfile,
  needsResummarization,
  summarizeUserForMemory,
  applyMemoryUpdate,
  markUpsellSuggested,
  wasUpsellSuggestedRecently,
  formatMemoryForPrompt,
  sweepStaleProfiles
};
