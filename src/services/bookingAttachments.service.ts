import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const bookingAttachmentsDirectory = path.resolve(process.cwd(), 'uploads', 'private-bookings');
export interface BookingAttachment { filename: string; name: string; mimeType: string; size: number }
const extensions: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' };

export async function saveBookingAttachments(files: Express.Multer.File[]) {
  const attachments: BookingAttachment[] = [];
  await fs.mkdir(bookingAttachmentsDirectory, { recursive: true });
  try {
    for (const file of files) {
      const filename = crypto.randomUUID() + extensions[file.mimetype];
      await fs.writeFile(path.join(bookingAttachmentsDirectory, filename), file.buffer, { flag: 'wx' });
      attachments.push({ filename, name: file.originalname, mimeType: file.mimetype, size: file.size });
    }
    return attachments;
  } catch (error) {
    await removeBookingAttachments(attachments);
    throw error;
  }
}

export async function removeBookingAttachments(attachments: BookingAttachment[]) {
  await Promise.all(attachments.map(file => fs.unlink(path.join(bookingAttachmentsDirectory, file.filename)).catch(() => undefined)));
}
