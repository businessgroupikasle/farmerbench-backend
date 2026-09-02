import { serviceBookingRepository } from '../repositories/serviceBooking.repository';
import { CreateServiceBookingInput, UpdateServiceBookingStatusInput, ServiceBookingQueryInput } from '@formerbench/shared';
import { AppError } from '../utils/response';
import { emitBookingCreated, emitBookingUpdated } from '../socket';

export class ServiceBookingService {
  private generateReferenceId(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `FB-SB-${randomDigits}`;
  }

  async createBooking(input: CreateServiceBookingInput, userId?: string) {
    let bookingReference = this.generateReferenceId();

    // Ensure uniqueness of reference
    let existing = await serviceBookingRepository.findByReference(bookingReference);
    let attempts = 0;
    while (existing && attempts < 5) {
      bookingReference = this.generateReferenceId();
      existing = await serviceBookingRepository.findByReference(bookingReference);
      attempts++;
    }

    const preferredDate = input.preferredDate ? new Date(input.preferredDate) : null;

    const booking = await serviceBookingRepository.create({
      bookingReference,
      serviceSlug: input.serviceSlug,
      serviceName: input.serviceName,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      location: input.location,
      farmSize: input.farmSize || null,
      cropType: input.cropType || null,
      preferredDate: isNaN(preferredDate?.getTime() || NaN) ? null : preferredDate,
      message: input.message || null,
      userId: userId || null,
    });

    // Realtime notification for Admin Dashboard
    emitBookingCreated(booking);

    return booking;
  }

  async getAllBookings(query: ServiceBookingQueryInput) {
    return serviceBookingRepository.findAll(query);
  }

  async getBookingById(id: string, userRole?: string, userId?: string) {
    const booking = await serviceBookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Service booking not found', 404);
    }

    if (userRole && userRole !== 'ADMIN' && booking.userId !== userId) {
      throw new AppError('Unauthorized access to this booking', 403);
    }

    return booking;
  }

  async updateBookingStatus(id: string, input: UpdateServiceBookingStatusInput) {
    const booking = await serviceBookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Service booking not found', 404);
    }

    const updated = await serviceBookingRepository.updateStatus(id, input.status, input.adminNotes);

    // Realtime broadcast to keep all open admin screens in sync
    emitBookingUpdated(updated);

    return updated;
  }

  async deleteBooking(id: string) {
    const booking = await serviceBookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Service booking not found', 404);
    }

    return serviceBookingRepository.delete(id);
  }

  async getBookingStats() {
    return serviceBookingRepository.getStats();
  }
}

export const serviceBookingService = new ServiceBookingService();
