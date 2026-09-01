import fs from 'fs';
import path from 'path';

const filePath = path.resolve('../farmer_frontend/src/utils/image.ts');
const content = `/**
 * Utility to resolve image URLs based on environment variables
 * Supports images uploaded to backend \`/uploads\` folder, external URLs, and local fallbacks.
 */

export const getUploadUrl = (filenameOrPath?: string | null, fallbackUrl?: string): string => {
  if (!filenameOrPath) {
    return fallbackUrl || '';
  }

  // Already a full external URL (http / https) or base64 / blob data URI
  if (
    filenameOrPath.startsWith('http://') ||
    filenameOrPath.startsWith('https://') ||
    filenameOrPath.startsWith('data:') ||
    filenameOrPath.startsWith('blob:')
  ) {
    return filenameOrPath;
  }

  // Get base URL from environment
  const rawUploadsBase =
    import.meta.env.VITE_UPLOADS_BASE_URL ||
    (import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\\/api\\/?$/, '/uploads')
      : 'http://localhost:5000/uploads');

  const base = rawUploadsBase.replace(/\\/+$/, '');

  // Normalize leading slashes
  let relativePath = filenameOrPath.replace(/^\\/+/, '');

  // If the path starts with 'uploads/', strip it since base already includes '/uploads'
  if (relativePath.startsWith('uploads/')) {
    relativePath = relativePath.slice('uploads/'.length);
  }

  return \`\${base}/\${relativePath}\`;
};

/**
 * Returns background image URL with local fallback asset
 */
export const getHeroBgUrl = (localFallback: string): string => {
  return localFallback;
};
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed image.ts successfully');
