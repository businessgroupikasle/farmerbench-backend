import { Router } from 'express';
import { serviceBookingController } from '../controllers/serviceBooking.controller';
import { requireAuth, requireAdmin, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  CreateServiceBookingSchema,
  UpdateServiceBookingStatusSchema,
  ServiceBookingQuerySchema,
} from '@formerbench/shared';

const router = Router();

// Public creation route (links user id if authenticated)
router.post(
  '/',
  optionalAuth,
  validateBody(CreateServiceBookingSchema),
  serviceBookingController.createBooking
);

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
