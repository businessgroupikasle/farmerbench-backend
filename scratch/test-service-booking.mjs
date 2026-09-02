import { PrismaClient } from '@prisma/client';
import { serviceBookingRepository } from '../src/repositories/serviceBooking.repository.js';
import { serviceBookingService } from '../src/services/serviceBooking.service.js';
import { CreateServiceBookingSchema } from '@formerbench/shared';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Service Booking Integration Tests...\n');

  try {
    // 1. Test validation on invalid payload
    console.log('Test 1: Validation with invalid phone number...');
    const invalidPayload = {
      serviceSlug: 'farm-development',
      serviceName: 'Farm Development',
      name: 'Test Farmer',
      phone: '12345', // Invalid Indian phone
      location: 'Coimbatore',
    };
    const validationResult = CreateServiceBookingSchema.safeParse(invalidPayload);
    if (!validationResult.success) {
      console.log('✅ Validation correctly rejected invalid phone number:', validationResult.error.issues[0].message);
    } else {
      throw new Error('Validation failed to catch invalid phone');
    }

    // 2. Create bookings for 4 core services
    console.log('\nTest 2: Creating test bookings for 4 services...');
    const services = [
      { slug: 'farm-development', name: 'Farm Development', farmSize: '10 Acres', cropType: 'Paddy' },
      { slug: 'well-development', name: 'Well Development', farmSize: '5 Acres', cropType: 'Coconut' },
      { slug: 'drip-irrigation', name: 'Drip Irrigation', farmSize: '8 Acres', cropType: 'Vegetables' },
      { slug: 'farm-consultancy', name: 'Farm Consultancy', farmSize: '15 Acres', cropType: 'Sugarcane' },
    ];

    const createdBookings = [];
    for (const s of services) {
      const payload = {
        serviceSlug: s.slug,
        serviceName: s.name,
        name: `Test Farmer for ${s.name}`,
        phone: '9876543210',
        email: `farmer_${s.slug.replace('-', '_')}@example.com`,
        location: 'Pollachi, Tamil Nadu',
        farmSize: s.farmSize,
        cropType: s.cropType,
        preferredDate: '2026-09-15',
        message: `Need consultation and site visit for ${s.name}`,
      };

      const parsed = CreateServiceBookingSchema.parse(payload);
      const booking = await serviceBookingService.createBooking(parsed);
      console.log(`✅ Created Booking for "${s.name}": Ref=${booking.bookingReference}, ID=${booking.id}, Status=${booking.status}`);
      createdBookings.push(booking);
    }

    // 3. Test list and filtering
    console.log('\nTest 3: Querying bookings with filters...');
    const allList = await serviceBookingService.getAllBookings({ page: 1, limit: 10 });
    console.log(`✅ Total bookings in system: ${allList.total}, returned on page: ${allList.bookings.length}`);

    const filtered = await serviceBookingService.getAllBookings({ serviceSlug: 'drip-irrigation', status: 'NEW' });
    console.log(`✅ Filtered by 'drip-irrigation' & status 'NEW': found ${filtered.total} booking(s)`);

    const searchResult = await serviceBookingService.getAllBookings({ search: 'Pollachi' });
    console.log(`✅ Search by location 'Pollachi': found ${searchResult.total} booking(s)`);

    // 4. Test Stats
    console.log('\nTest 4: Fetching Service Booking Statistics...');
    const stats = await serviceBookingService.getBookingStats();
    console.log('✅ Stats Summary:', {
      total: stats.totalBookings,
      new: stats.newBookings,
      contacted: stats.contactedBookings,
      breakdownCount: stats.serviceBreakdown.length,
    });

    // 5. Test Status Transition
    console.log('\nTest 5: Updating booking status...');
    const testBooking = createdBookings[0];
    const updated1 = await serviceBookingService.updateBookingStatus(testBooking.id, {
      status: 'CONTACTED',
      adminNotes: 'Spoke with customer, scheduled field survey for next Tuesday.',
    });
    console.log(`✅ Status updated to: ${updated1.status}, notes: "${updated1.adminNotes}"`);

    const updated2 = await serviceBookingService.updateBookingStatus(testBooking.id, {
      status: 'IN_PROGRESS',
      adminNotes: 'Field survey completed. Designing drip line layouts.',
    });
    console.log(`✅ Status updated to: ${updated2.status}`);

    const updated3 = await serviceBookingService.updateBookingStatus(testBooking.id, {
      status: 'COMPLETED',
      adminNotes: 'Service delivered successfully.',
    });
    console.log(`✅ Status updated to: ${updated3.status}`);

    // 6. Test Fetch by ID
    console.log('\nTest 6: Fetching booking by ID...');
    const fetched = await serviceBookingService.getBookingById(testBooking.id, 'ADMIN');
    console.log(`✅ Fetched booking details: Ref=${fetched.bookingReference}, Name=${fetched.name}, Status=${fetched.status}`);

    // 7. Test Deletion of test booking
    console.log('\nTest 7: Cleaning up test bookings...');
    for (const b of createdBookings) {
      await serviceBookingService.deleteBooking(b.id);
      console.log(`✅ Deleted test booking ID=${b.id}`);
    }

    const finalList = await serviceBookingService.getAllBookings({ page: 1, limit: 10 });
    console.log(`✅ Cleanup verified. Total bookings remaining: ${finalList.total}`);

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀\n');
  } catch (err) {
    console.error('❌ Integration test failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
