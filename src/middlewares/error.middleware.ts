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

  // Upload problems (file too large, too many files) are client errors, not 500s
  if (err?.name === 'MulterError') {
    return sendError(res, err.message || 'Invalid upload', 400);
  }

  // Malformed JSON / oversized request bodies from body-parser
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    return sendError(res, err.type === 'entity.too.large' ? 'Request body is too large' : 'Malformed request body', err.status || 400);
  }

  // Stack traces are logged above, never returned to clients.
  const message = env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  return sendError(res, message, 500);
};
