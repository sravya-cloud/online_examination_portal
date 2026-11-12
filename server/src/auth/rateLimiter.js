// Small in-memory limiter against password guessing (NFR-01).
// Counts failed attempts per key (IP + email) inside a sliding window.
export function createLoginLimiter({
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000,
  now = () => Date.now(),
} = {}) {
  const failures = new Map();

  function recent(key) {
    const cutoff = now() - windowMs;
    const list = (failures.get(key) || []).filter((t) => t > cutoff);
    if (list.length) failures.set(key, list);
    else failures.delete(key);
    return list;
  }

  return {
    isBlocked(key) {
      return recent(key).length >= maxAttempts;
    },
    recordFailure(key) {
      const list = recent(key);
      list.push(now());
      failures.set(key, list);
    },
    reset(key) {
      failures.delete(key);
    },
  };
}
