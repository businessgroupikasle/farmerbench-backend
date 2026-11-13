import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/response';
import { matchesSignature } from './upload.middleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 5, fields: 1, fieldSize: 100000 },
}).array('files', 5);

export function bookingUpload(req: Request, res: Response, next: NextFunction) {
  if (!req.is('multipart/form-data')) return next();
  upload(req, res, (error) => {
    if (error) return next(new AppError('Upload up to 5 JPG, PNG, WebP, GIF or PDF files, each no larger than 20 MB.', 400));
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      for (const file of files) {
        const valid = file.mimetype === 'application/pdf'
          ? file.buffer.subarray(0, 5).toString('ascii') === '%PDF-'
          : matchesSignature(file.buffer.subarray(0, 12), file.mimetype);
        if (!valid) throw new AppError('Only valid JPG, PNG, WebP, GIF or PDF files are supported.', 400);
      }
      req.body = JSON.parse(req.body.payload);
      next();
    } catch (error) {
      next(error instanceof AppError ? error : new AppError('Invalid service request', 400));
    }
  });
}
