import { Router } from 'express';
import path from 'path';
import { bookingUpload } from '../middlewares/bookingUpload.middleware';
import { serviceBookingService } from '../services/serviceBooking.service';
import { bookingAttachmentsDirectory, BookingAttachment } from '../services/bookingAttachments.service';
import { serviceBookingController } from '../controllers/serviceBooking.controller';
import { requireAuth, requireAdmin, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { serviceBookingRateLimiter } from '../middlewares/rateLimit.middleware';
import {
  CreateServiceBookingSchema,
  UpdateServiceBookingStatusSchema,
  ServiceBookingQuerySchema,
} from '@formerbench/shared';

const router = Router();

// Public creation route (links user id if authenticated)
router.post(
  '/',
  serviceBookingRateLimiter,
  optionalAuth,
  bookingUpload,
  validateBody(CreateServiceBookingSchema),
  serviceBookingController.createBooking
);

// Signed-in user booking history
router.get('/mine', requireAuth, serviceBookingController.getMyBookings);

// Admin summary metrics
router.get('/stats', requireAuth, requireAdmin, serviceBookingController.getBookingStats);

// Admin list & filtering
router.get(
  '/',
  requireAuth,
  requireAdmin,
  validateQuery(ServiceBookingQuerySchema),
  serviceBookingController.getAllBookings
);

// Get single booking details (Admin or booking owner)
router.get('/:id/attachments/:filename', requireAuth, async (req, res, next) => {
  try {
    const booking = await serviceBookingService.getBookingById(req.params.id, req.user!.role, req.user!.userId);
    const attachments = (booking.attachments || []) as unknown as BookingAttachment[];
    const file = attachments.find(item => item.filename === req.params.filename);
    if (!file || path.basename(file.filename) !== file.filename) return res.status(404).json({ success: false, message: 'Attachment not found' });
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.sendFile(path.join(bookingAttachmentsDirectory, file.filename), error => { if (error) next(error); });
  } catch (error) { next(error); }
});
router.get('/:id', requireAuth, serviceBookingController.getBookingById);

// Admin update status
router.patch(
  '/:id/status',
  requireAuth,
  requireAdmin,
  validateBody(UpdateServiceBookingStatusSchema),
  serviceBookingController.updateBookingStatus
);

// Admin delete booking
router.delete('/:id', requireAuth, requireAdmin, serviceBookingController.deleteBooking);

export default router;
