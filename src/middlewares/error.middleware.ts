import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/response';
import { env } from '../config/env';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Unhandled Error:', err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? (err.meta.target as string[]).join(', ') : 'field';
    return sendError(res, `A record with this ${fields} already exists`, 409);
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return sendError(res, 'Requested resource not found', 404);
  }

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return sendError(res, message, 500, env.NODE_ENV === 'development' ? err.stack : undefined);
};
