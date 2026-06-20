function createRateLimiter({
  windowMs = 60000,
  maxRequests = 60,
  message = "Too many requests. Please try again later.",
}) {
  const bucket = new Map();

  return function rateLimiter(req, res, next) {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const existing = bucket.get(key);

    if (!existing || now - existing.start > windowMs) {
      bucket.set(key, { count: 1, start: now });
      next();
      return;
    }

    if (existing.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message,
      });
      return;
    }

    existing.count += 1;
    next();
  };
}

module.exports = {
  createRateLimiter,
};
