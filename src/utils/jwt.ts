import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@formerbench/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  /** Token type. Session tokens are "access"; tokens issued before this field existed have none. */
  typ?: 'access';
  /** Password fingerprint: changes when the password changes, invalidating older sessions. */
  pv?: string;
  /** Original authentication time (seconds), preserved across refreshes to cap session lifetime. */
  oat?: number;
  iat?: number;
  exp?: number;
}

const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

/** Absolute session lifetime: /auth/refresh-token cannot extend a session beyond this. */
export const MAX_SESSION_AGE_SECONDS = 30 * 24 * 60 * 60;

/**
 * Keyed fingerprint of the stored password hash. Embedding it in the token lets the
 * server reject sessions issued before a password change/reset. HMAC (keyed with the
 * JWT secret) so the token never exposes anything derived from the hash itself.
 */
export const passwordFingerprint = (passwordHash: string | null | undefined): string =>
  crypto.createHmac('sha256', env.JWT_SECRET).update(`pv:${passwordHash || ''}`).digest('base64url').slice(0, 16);

/** Legacy signature kept for compatibility; prefer issueSessionToken. */
export const generateToken = (payload: TokenPayload): string => {
  const { iat: _iat, exp: _exp, ...claims } = payload;
  return jwt.sign({ ...claims, typ: 'access' }, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

/** Issues a session token bound to the user's current password. */
export const issueSessionToken = (
  user: { id: string; email: string; role: Role },
  passwordHash: string | null | undefined,
  originalAuthAt: number = Math.floor(Date.now() / 1000)
): string =>
  generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    pv: passwordFingerprint(passwordHash),
    oat: originalAuthAt,
  });

export const verifyToken = (token: string): TokenPayload => {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as TokenPayload & {
    typ?: string;
    purpose?: string;
  };
  // Reject non-session tokens signed with the same key (e.g. registration tokens).
  if ((payload.typ && payload.typ !== 'access') || payload.purpose || typeof payload.userId !== 'string') {
    throw new Error('Invalid token type');
  }
  return payload;
};

/** Registration-completion tokens (email verified, account not yet created). */
export const signRegistrationToken = (email: string): string =>
  jwt.sign({ email, purpose: 'REGISTRATION_COMPLETION', typ: 'registration' }, env.JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: '15m',
  });

export const verifyRegistrationToken = (token: string): jwt.JwtPayload =>
  jwt.verify(token, env.JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as jwt.JwtPayload;
