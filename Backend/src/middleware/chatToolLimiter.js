const WINDOW_MS = 15 * 60 * 1000;
const MAX_TOOL_CALLS = 8;

const buckets = new Map();

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
