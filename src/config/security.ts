import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from './env';

// ---------------------------------------------------------------------------
// CORS origin policy
// ---------------------------------------------------------------------------

const PRIVATE_HOST = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\])$/i;

const frontendHost = (() => {
  try {
    return new URL(env.FRONTEND_URL).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
})();

const rejectedOriginsLogged = new Set<string>();

/**
 * An origin is allowed when it is listed in CORS_ORIGIN, or is the FRONTEND_URL site
 * (including www/sub-domains). In non-production, localhost and private-LAN origins
 * are also allowed so mobile testing on the local network keeps working.
 */
export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // same-origin, server-to-server, curl, mobile apps
  if (env.corsOrigins.includes('*') || env.corsOrigins.includes(origin)) return true;

  let host = '';
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }

  if (frontendHost && (host === frontendHost || host.endsWith(`.${frontendHost}`))) return true;
  if (env.NODE_ENV !== 'production' && PRIVATE_HOST.test(host)) return true;

  if (!rejectedOriginsLogged.has(origin) && rejectedOriginsLogged.size < 100) {
    rejectedOriginsLogged.add(origin);
    console.warn(`[security] CORS: blocked request origin ${origin}. Add it to CORS_ORIGIN if it is legitimate.`);
  }
  return false;
};

// ---------------------------------------------------------------------------
// HTTP security headers (API responses)
// ---------------------------------------------------------------------------

export const apiSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // JSON API responses never need to load or execute anything.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};

/** Headers for user-uploaded files: rendered only as inert images, embeddable cross-origin. */
export const uploadResponseHeaders = (res: Response) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
};

// ---------------------------------------------------------------------------
// Startup configuration checks
// ---------------------------------------------------------------------------

// SHA-256 of JWT secrets that have been published in this repository
// (.env.example / docker-compose.yml defaults). Values are not stored here.
const PUBLIC_JWT_SECRET_HASHES = new Set([
  'a50a83464e36ca3a27ba7629a55f4c5dbda3da8b93d7d159c90d541892b74bf1',
]);

const looksLikePlaceholder = (value: string) =>
  /change[_-]?me|your[_-]?(jwt|secret)|example|placeholder|development_jwt_secret/i.test(value) ||
  new Set(value).size < 12;

export const runStartupSecurityChecks = () => {
  const jwtHash = crypto.createHash('sha256').update(env.JWT_SECRET).digest('hex');
  const insecureJwt = PUBLIC_JWT_SECRET_HASHES.has(jwtHash) || looksLikePlaceholder(env.JWT_SECRET);

  if (insecureJwt) {
    const message =
      'JWT_SECRET is a publicly known/placeholder value. Anyone with repository access could forge login tokens. ' +
      'Generate a new one (e.g. `openssl rand -base64 48`), set it in the server .env and restart (all users will need to sign in again).';
    if (env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_JWT_SECRET !== 'true') {
      console.error(`❌ FATAL: ${message}`);
      process.exit(1);
    }
    console.error(`⚠️ [security] ${message}`);
  }

  if (env.RAZORPAY_KEY_ID.startsWith('rzp_live_') && env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ [security] LIVE Razorpay keys are configured while NODE_ENV is not "production". ' +
        'Use rzp_test_ keys for development and keep live keys only on the production server.'
    );
  }
};
