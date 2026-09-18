const { RateLimitError } = require('../utils/AppError');

// In-memory only - correct for a single Express process (blueprint §2: no Redis).
// Entries are never evicted; for portfolio-scope traffic this is a non-issue, not a "just in
// case" cleanup mechanism the no-backups principle would rule out anyway.
const buckets = new Map();

function rateLimiter({ windowMs, max }) {
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      throw new RateLimitError(`Too many requests, try again in ${Math.ceil((bucket.resetAt - now) / 1000)}s`);
    }

    bucket.count += 1;
    next();
  };
}

module.exports = rateLimiter;
