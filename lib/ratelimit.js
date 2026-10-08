/**
 * In-memory best-effort per-IP rate limiter.
 * Note: In-memory limits are per server instance and not shared across distributed serverless instances.
 */

const ipRequests = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRequests.entries()) {
    if (now > record.resetTime) {
      ipRequests.delete(key);
    }
  }
}, 60 * 1000).unref?.();

export function rateLimit(req, res, { max = 30, windowMs = 60 * 1000, route = 'default' } = {}) {
  const headers = req?.headers || {};
  const ip = headers['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress || 'unknown-ip';
  const key = `${route}:${ip}`;
  const now = Date.now();

  let record = ipRequests.get(key);
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + windowMs
    };
    ipRequests.set(key, record);
  }

  record.count++;

  const remaining = Math.max(0, max - record.count);
  const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(remaining));

  if (record.count > max) {
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({
      error: `Rate limit exceeded. Please try again in ${retryAfterSec} seconds.`
    });
    return false;
  }

  return true;
}
