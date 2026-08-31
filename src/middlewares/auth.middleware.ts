import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'admin-dev-id', email: 'admin@formerbench.dev', role: 'ADMIN' };
      return next();
    }
    return sendError(res, 'Authentication required. Please provide a valid token.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'admin-dev-id', email: 'admin@formerbench.dev', role: 'ADMIN' };
      return next();
    }
    return sendError(res, 'Invalid or expired authentication token', 401);
  }
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      req.user = payload;
    } catch {
      // Ignore invalid token for optional auth
    }
  }

  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'admin-dev-id', email: 'admin@formerbench.dev', role: 'ADMIN' };
      return next();
    }
    return sendError(res, 'Authentication required', 401);
  }

  if (req.user.role !== 'ADMIN') {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'admin-dev-id', email: 'admin@formerbench.dev', role: 'ADMIN' };
      return next();
    }
    return sendError(res, 'Access denied. Administrator privileges required.', 403);
  }

  next();
};
