const rateLimitStore = new Map();

const getClientIp = (req) =>
  String(
    req.headers["x-forwarded-for"] ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown"
  )
    .split(",")[0]
    .trim();

const cleanupExpiredEntries = (now) => {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.expiresAt <= now) {
      rateLimitStore.delete(key);
    }
  }
};

export const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 10,
  keyPrefix = "global",
  message = "Too many requests. Please try again later.",
  keyGenerator,
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    cleanupExpiredEntries(now);

    const resolvedKey =
      typeof keyGenerator === "function"
        ? keyGenerator(req)
        : `${getClientIp(req)}:${req.path}`;
    const key = `${keyPrefix}:${resolvedKey}`;
    const existingEntry = rateLimitStore.get(key);

    if (!existingEntry || existingEntry.expiresAt <= now) {
      rateLimitStore.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    if (existingEntry.count >= max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existingEntry.expiresAt - now) / 1000)
      );

      res.setHeader("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        message,
        code: "RATE_LIMITED",
        retryAfterSeconds,
      });
    }

    existingEntry.count += 1;
    rateLimitStore.set(key, existingEntry);
    return next();
  };
};
