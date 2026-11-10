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
 * Resolves the client IP using Express's `trust proxy` setting (configured from
 * TRUST_PROXY in src/index.ts). Never read X-Forwarded-For directly: it is
 * client-controlled unless it was appended by a trusted reverse proxy.
 */
export const getClientIp = (req: Request): string =>
  req.ip || req.socket?.remoteAddress || 'unknown_ip';

const ipKey = (req: Request) => getClientIp(req);

const ipAndEmailKey = (req: Request) => {
  const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : '';
  return `${getClientIp(req)}:${email}`;
};

/**
 * In-Memory Fixed Window Rate Limiter.
 * Modular design allowing easy replacement with Redis/Distributed cache in multi-instance production.
 * Note: counters are per process; with PM2 cluster mode each worker keeps its own counters.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests from this IP/account, please try again later.',
    keyGenerator = ipAndEmailKey,
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
 * Standard rate limiter for login, password reset and OTP endpoints:
 * 30 requests per minute per IP/email.
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts.',
});

/**
 * Per-IP ceiling across all authentication endpoints (credential stuffing across
 * many email addresses from one source): 100 requests per 15 minutes per IP.
 */
export const authIpRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication requests from this network.',
  keyGenerator: ipKey,
});

/**
 * Endpoints that send an email (OTP / reset codes): 20 per 15 minutes per IP,
 * protecting customers' inboxes and the SMTP sender reputation.
 */
export const emailSendRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many verification emails requested from this network.',
  keyGenerator: ipKey,
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

export const contactRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many contact requests.',
  keyGenerator: ipKey,
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 120,
  message: 'Too many upload requests.',
  keyGenerator: ipKey,
});

export const couponValidateRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many coupon checks.',
  keyGenerator: ipKey,
});

export const serviceBookingRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many service requests.',
  keyGenerator: ipKey,
});

/** Review writes (applied after requireAuth, so keyed per user). */
export const reviewRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many review submissions.',
  keyGenerator: (req) => req.user?.userId || getClientIp(req),
});

export const postalCodeRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many pincode lookups.',
  keyGenerator: ipKey,
});
