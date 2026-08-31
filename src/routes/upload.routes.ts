import { Router, Request, Response, NextFunction } from 'express';
import { uploadImage } from '../middlewares/upload.middleware';
import { sendSuccess, AppError } from '../utils/response';

const router = Router();

router.post('/image', (req: Request, res: Response, next: NextFunction) => {
  uploadImage.single('file')(req, res, (err: any) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No image file provided in form-data field "file"', 400));
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    return sendSuccess(
      res,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: fileUrl,
      },
      'Image uploaded successfully',
      201
    );
  });
});

export default router;
