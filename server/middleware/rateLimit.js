/**
 * Simple in-memory rate limiter.
 * For production, use express-rate-limit with Redis store.
 */
const windows = new Map(); // ip -> { count, resetAt }

/**
 * createRateLimiter(maxRequests, windowMs)
 * Returns an Express middleware that limits requests per IP.
 */
function createRateLimiter(maxRequests, windowMs) {
  return (req, res, next) => {
    const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const now = Date.now();
    const entry = windows.get(ip);

    if (!entry || now > entry.resetAt) {
      windows.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: `Too many requests. Retry after ${retryAfter}s`,
      });
    }

    entry.count++;
    next();
  };
}

module.exports = { createRateLimiter };
