import { AppError } from './response';

/**
 * Per-account failed password login tracking (in-memory, per process).
 * After MAX_FAILURES failed attempts inside WINDOW_MS the account's password
 * login is locked for LOCK_MS. A successful login clears the counter.
 * OTP login and password reset remain available so legitimate owners are never
 * fully locked out.
 */
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

interface LockoutEntry {
  failures: number;
  windowStart: number;
  lockedUntil: number;
}

const store = new Map<string, LockoutEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.lockedUntil < now && now - entry.windowStart > WINDOW_MS) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

const normalize = (email: string) => email.toLowerCase().trim();

export const loginLockout = {
  assertNotLocked(email: string) {
    const entry = store.get(normalize(email));
    const now = Date.now();
    if (entry && entry.lockedUntil > now) {
      const minutes = Math.ceil((entry.lockedUntil - now) / 60000);
      throw new AppError(
        `Too many failed sign-in attempts. Please try again in ${minutes} minute(s), sign in with an email code, or reset your password.`,
        429,
        { code: 'ACCOUNT_TEMPORARILY_LOCKED' }
      );
    }
  },

  recordFailure(email: string) {
    const key = normalize(email);
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || now - entry.windowStart > WINDOW_MS) {
      store.set(key, { failures: 1, windowStart: now, lockedUntil: 0 });
      return;
    }
    entry.failures += 1;
    if (entry.failures >= MAX_FAILURES) {
      entry.lockedUntil = now + LOCK_MS;
      console.warn(`[security] Password login temporarily locked after ${entry.failures} failed attempts.`);
    }
  },

  reset(email: string) {
    store.delete(normalize(email));
  },
};
