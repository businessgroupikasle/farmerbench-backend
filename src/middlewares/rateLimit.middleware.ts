import { Request, Response, NextFunction } from 'express';

interface RateLimitStoreEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * In-Memory Sliding Window Rate Limiter.
 * Modular design allowing easy replacement with Redis/Distributed cache in multi-instance production.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP/account, please try again later.',
    keyGenerator = (req: Request) => {
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        req.ip ||
        'unknown_ip';
      const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
      return `${clientIp}:${email}`;
    },
  } = options;

  const store = new Map<string, RateLimitStoreEntry>();

  // Periodically clean up expired keys to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60000)).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const current = store.get(key);

    if (!current || now > current.resetTime) {
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil((current.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: `${message} Please wait ${retryAfterSeconds}s before trying again.`,
      });
    }

    current.count += 1;
    return next();
  };
};

/**
 * Standard rate limiter for password reset and OTP endpoints:
 * 30 requests per minute per IP/email (robust security with smooth testing).
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts.',
});

/**
 * Rate limiter for OTP verification calls:
 * 30 verification calls per minute.
 */
export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many verification attempts.',
});
