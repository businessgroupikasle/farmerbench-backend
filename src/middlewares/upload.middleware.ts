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
  'blogs/featured': 'blogs/featured',
  'blogs/content': 'blogs/content',
};

/** Resolves a folder key without consulting the object prototype (e.g. "__proto__"). */
export const resolveUploadFolder = (folder: string): string | undefined =>
  Object.prototype.hasOwnProperty.call(ALLOWED_UPLOAD_FOLDERS, folder) ? ALLOWED_UPLOAD_FOLDERS[folder] : undefined;

/**
 * Raster image types only. SVG is intentionally excluded: it can carry script and is
 * served from the API origin. The stored extension is derived from the MIME type
 * (never from the client-supplied file name).
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Extensions that the public /uploads route is allowed to serve. */
export const SERVABLE_UPLOAD_EXTENSIONS = ALLOWED_EXTENSIONS;

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folderParam = typeof req.query?.folder === 'string' ? req.query.folder.trim() : '';
    if (folderParam) {
      const allowedSub = resolveUploadFolder(folderParam);
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
    const ext = MIME_TO_EXTENSION[file.mimetype] || '.bin';
    const originalExt = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, originalExt).replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase().slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const finalFilename = baseName ? `${baseName}-${uniqueSuffix}${ext}` : `${uniqueSuffix}${ext}`;
    cb(null, finalFilename);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (MIME_TO_EXTENSION[file.mimetype] && (!ext || ALLOWED_EXTENSIONS.has(ext))) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP, GIF) are allowed for upload', 400) as any);
  }
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum
  },
});

export const matchesSignature = (header: Buffer, mimetype: string): boolean => {
  switch (mimetype) {
    case 'image/jpeg':
      return header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    case 'image/png':
      return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/gif': {
      const sig = header.subarray(0, 6).toString('ascii');
      return sig === 'GIF87a' || sig === 'GIF89a';
    }
    case 'image/webp':
      return header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
    default:
      return false;
  }
};

/**
 * Verifies each stored file really is the image type it claims to be (magic bytes).
 * The browser-supplied Content-Type cannot be trusted. If any file fails, every file
 * from the request is deleted and a 400 error is thrown.
 */
export const verifyUploadedImages = async (files: Express.Multer.File[]) => {
  const results = await Promise.all(
    files.map(async (file) => {
      let handle: fs.promises.FileHandle | undefined;
      try {
        handle = await fs.promises.open(file.path, 'r');
        const header = Buffer.alloc(12);
        await handle.read(header, 0, 12, 0);
        return matchesSignature(header, file.mimetype);
      } catch {
        return false;
      } finally {
        await handle?.close();
      }
    })
  );

  if (results.every(Boolean)) return;

  await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => undefined)));
  throw new AppError('Uploaded file content is not a valid JPEG, PNG, WebP or GIF image', 400);
};
