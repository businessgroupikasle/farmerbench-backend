import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

export const validateBody = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Validation failed', 400, error.format());
      }
      return sendError(res, 'Bad request', 400);
    }
  };
};

export const validateQuery = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Invalid query parameters', 400, error.format());
      }
      return sendError(res, 'Bad request', 400);
    }
  };
};

export const validateParams = (schema: ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return sendError(res, 'Invalid path parameters', 400, error.format());
      }
      return sendError(res, 'Bad request', 400);
    }
  };
};
