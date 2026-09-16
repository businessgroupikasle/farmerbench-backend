import { Router, Request, Response, NextFunction } from 'express';
import { uploadImage, ALLOWED_UPLOAD_FOLDERS } from '../middlewares/upload.middleware';
import { sendSuccess, AppError } from '../utils/response';

const router = Router();

const toUploadedImage = (file: Express.Multer.File, safeSub?: string) => ({
  filename: file.filename,
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  url: safeSub ? `/uploads/${safeSub}/${file.filename}` : `/uploads/${file.filename}`,
});

router.post('/images', (req: Request, res: Response, next: NextFunction) => {
  uploadImage.array('files', 12)(req, res, (err: any) => {
    if (err) return next(err);

    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (!files.length) {
      return next(new AppError('No image files provided in form-data field "files"', 400));
    }

    const folderParam = typeof req.query?.folder === 'string' ? req.query.folder.trim() : '';
    const safeSub = folderParam ? ALLOWED_UPLOAD_FOLDERS[folderParam] : undefined;

    return sendSuccess(
      res,
      { files: files.map((file) => toUploadedImage(file, safeSub)) },
      `${files.length} images uploaded successfully`,
      201
    );
  });
});

router.post('/image', (req: Request, res: Response, next: NextFunction) => {
  uploadImage.single('file')(req, res, (err: any) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No image file provided in form-data field "file"', 400));
    }

    const folderParam = typeof req.query?.folder === 'string' ? req.query.folder.trim() : '';
    const safeSub = folderParam ? ALLOWED_UPLOAD_FOLDERS[folderParam] : undefined;
    return sendSuccess(
      res,
      toUploadedImage(req.file, safeSub),
      'Image uploaded successfully',
      201
    );
  });
});

export default router;

