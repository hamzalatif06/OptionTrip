/**
 * Chat Tool Limiter
 * Scoped specifically to Vi's tool-calling (e.g. flight search) — NOT a
 * blanket rate limit on chat traffic. Free-text conversation stays
 * unthrottled; this only guards the newly-exposed real, metered paid flight
 * APIs from being fanned out to repeatedly from a single chat session.
 *
 * Plain in-memory Map, matching the same idiom travelpayoutsFlightService.js
 * already uses for its own cache — no new dependency.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TOOL_CALLS = 8;         // per key, per window

const buckets = new Map();

/**
 * @param {string} key  user._id (signed-in) or req.ip (guest)
 * @returns {boolean}   true if this tool call is within budget (and consumes one unit)
 */
export const checkFlightToolBudget = (key) => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (bucket.count >= MAX_TOOL_CALLS) return false;

  bucket.count++;
  return true;
};

export default { checkFlightToolBudget };
