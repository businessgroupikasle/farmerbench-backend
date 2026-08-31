import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateBody = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!schema || typeof schema.parseAsync !== 'function') {
      console.error('CRITICAL: validateBody received an undefined or invalid schema!');
      return sendError(res, 'Internal validation configuration error', 500);
    }
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0]?.message || 'Validation failed';
        return sendError(res, firstIssue, 400, error.format());
      }
      return sendError(res, error?.message || 'Bad request', 400);
    }
  };
};

export const validateQuery = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!schema || typeof schema.parseAsync !== 'function') {
      console.error('CRITICAL: validateQuery received an undefined or invalid schema!');
      return sendError(res, 'Internal validation configuration error', 500);
    }
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0]?.message || 'Invalid query parameters';
        return sendError(res, firstIssue, 400, error.format());
      }
      return sendError(res, error?.message || 'Bad request', 400);
    }
  };
};

export const validateParams = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!schema || typeof schema.parseAsync !== 'function') {
      console.error('CRITICAL: validateParams received an undefined or invalid schema!');
      return sendError(res, 'Internal validation configuration error', 500);
    }
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0]?.message || 'Invalid path parameters';
        return sendError(res, firstIssue, 400, error.format());
      }
      return sendError(res, error?.message || 'Bad request', 400);
    }
  };
};
