import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload, passwordFingerprint } from '../utils/jwt';
import { sendError } from '../utils/response';
import { userRepository } from '../repositories/user.repository';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

type AuthResult =
  | { ok: true; user: TokenPayload }
  | { ok: false; status: number; message: string };

/**
 * Validates a bearer token against the current database state:
 * - the account must exist and not be deactivated,
 * - the token must have been issued for the current password (sessions end on password change/reset),
 * - the role is taken from the database, never from the token claims.
 */
export const authenticateToken = async (token: string): Promise<AuthResult> => {
  let payload: TokenPayload;
  try {
    payload = verifyToken(token);
  } catch {
    return { ok: false, status: 401, message: 'Invalid or expired authentication token' };
  }

  const user = await userRepository.findAuthStateById(payload.userId);
  if (!user) {
    return { ok: false, status: 401, message: 'User account no longer exists' };
  }
  if (user.status === 'Deactivated') {
    return { ok: false, status: 403, message: 'Your account has been deactivated. Please contact support.' };
  }
  // Tokens issued before session binding existed carry no fingerprint and remain valid until they expire.
  if (payload.pv !== undefined && payload.pv !== passwordFingerprint(user.password)) {
    return { ok: false, status: 401, message: 'Your session has expired. Please sign in again.' };
  }

  return {
    ok: true,
    user: { ...payload, userId: user.id, email: user.email, role: user.role },
  };
};

const bearerToken = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim() || null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = bearerToken(req);
  if (!token) {
    return sendError(res, 'Authentication required. Please provide a valid token.', 401);
  }

  try {
    const result = await authenticateToken(token);
    if (!result.ok) {
      return sendError(res, result.message, result.status);
    }
    req.user = result.user;
    next();
  } catch (error) {
    next(error);
  }
};

/** Attaches req.user when a valid session token is present; otherwise continues anonymously. */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = bearerToken(req);
  if (token) {
    try {
      const result = await authenticateToken(token);
      if (result.ok) req.user = result.user;
    } catch {
      // Ignore lookup failures for optional auth
    }
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return sendError(res, 'Authentication required', 401);
  }

  if (req.user.role !== 'ADMIN') {
    return sendError(res, 'Access denied. Administrator privileges required.', 403);
  }

  // Lightweight audit trail of administrative changes (who, what, result).
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const adminId = req.user.userId;
    const startedAt = Date.now();
    res.on('finish', () => {
      console.log(
        `[admin-audit] ${new Date().toISOString()} admin=${adminId} ${req.method} ${req.originalUrl.split('?')[0]} ` +
          `status=${res.statusCode} ip=${req.ip} ${Date.now() - startedAt}ms`
      );
    });
  }

  next();
};
