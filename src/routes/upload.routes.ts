import { Router, Request, Response, NextFunction } from 'express';
import { uploadImage, resolveUploadFolder, verifyUploadedImages } from '../middlewares/upload.middleware';
import { sendSuccess, AppError } from '../utils/response';
import { uploadRateLimiter } from '../middlewares/rateLimit.middleware';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Uploads are an admin-only feature (products, categories, banners, blogs).
router.use(uploadRateLimiter, requireAuth, requireAdmin);

const toUploadedImage = (file: Express.Multer.File, safeSub?: string) => ({
  filename: file.filename,
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  url: safeSub ? `/uploads/${safeSub}/${file.filename}` : `/uploads/${file.filename}`,
});

const folderFrom = (req: Request) => {
  const folderParam = typeof req.query?.folder === 'string' ? req.query.folder.trim() : '';
  return folderParam ? resolveUploadFolder(folderParam) : undefined;
};

router.post('/images', (req: Request, res: Response, next: NextFunction) => {
  uploadImage.array('files', 12)(req, res, async (err: any) => {
    if (err) return next(err);

    const files = (req.files as Express.Multer.File[] | undefined) || [];
    if (!files.length) {
      return next(new AppError('No image files provided in form-data field "files"', 400));
    }

    try {
      await verifyUploadedImages(files);
    } catch (verifyError) {
      return next(verifyError);
    }

    const safeSub = folderFrom(req);
    return sendSuccess(
      res,
      { files: files.map((file) => toUploadedImage(file, safeSub)) },
      `${files.length} images uploaded successfully`,
      201
    );
  });
});

router.post('/image', (req: Request, res: Response, next: NextFunction) => {
  uploadImage.single('file')(req, res, async (err: any) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No image file provided in form-data field "file"', 400));
    }

    try {
      await verifyUploadedImages([req.file]);
    } catch (verifyError) {
      return next(verifyError);
    }

    const safeSub = folderFrom(req);
    return sendSuccess(
      res,
      toUploadedImage(req.file, safeSub),
      'Image uploaded successfully',
      201
    );
  });
});

export default router;
