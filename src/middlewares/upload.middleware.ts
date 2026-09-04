import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { AppError } from '../utils/response';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Predefined safe subfolder destinations
export const ALLOWED_UPLOAD_FOLDERS: Record<string, string> = {
  'products/gallery': 'products/gallery',
  'products': 'products',
  'categories': 'categories',
  'banners': 'banners',
  'avatars': 'avatars',
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folderParam = typeof req.query?.folder === 'string' ? req.query.folder.trim() : '';
    if (folderParam) {
      const allowedSub = ALLOWED_UPLOAD_FOLDERS[folderParam];
      if (!allowedSub) {
        return cb(new AppError(`Invalid upload folder "${folderParam}". Allowed: ${Object.keys(ALLOWED_UPLOAD_FOLDERS).join(', ')}`, 400) as any, '');
      }
      const targetDir = path.resolve(uploadsDir, allowedSub);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      return cb(null, targetDir);
    }
    // Default fallback: root uploads/ directory (100% backward compatible)
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase().slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const finalFilename = baseName ? `${baseName}-${uniqueSuffix}${ext}` : `${uniqueSuffix}${ext}`;
    cb(null, finalFilename);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed for upload', 400) as any);
  }
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
});
