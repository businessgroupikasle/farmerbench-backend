/** Run against the local development database: npx tsx tests/admin-regressions.ts --database */
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateExpertSchema, AdminCreateCustomerSchema, StoreSettingsSchema } from '../src/validators/admin.schemas';
import { CompleteRegistrationSchema, CreateServiceBookingSchema } from '../shared/src/schemas';
import { prisma } from '../src/config/database';
import { orderRepository } from '../src/repositories/order.repository';
import { productRepository } from '../src/repositories/product.repository';
import bookingsRouter from '../src/routes/serviceBooking.routes';
import { errorHandler } from '../src/middlewares/error.middleware';
import { issueSessionToken } from '../src/utils/jwt';
import { removeBookingAttachments, BookingAttachment } from '../src/services/bookingAttachments.service';
import { authService } from '../src/services/auth.service';
import { userRepository } from '../src/repositories/user.repository';
import storeSettingsRouter from '../src/routes/storeSettings.routes';
import adminRouter from '../src/routes/admin.routes';

async function main() {
  const expert = { name: 'Dr. R. Senthil, M.Sc. (Agri)', specialization: 'Soil Health', territory: 'Chennai', phone: '9876543210' };
  assert(CreateExpertSchema.safeParse(expert).success);
  assert(CreateExpertSchema.safeParse({ ...expert, name: 'மீனா M.Sc.' }).success);
  for (const name of ['5988899', '123456', '...']) assert(!CreateExpertSchema.safeParse({ ...expert, name }).success);
  for (const phone of ['', '98765432101', '987654321', 'abcdefghij', '1234567890']) {
    assert(!CreateExpertSchema.safeParse({ ...expert, phone }).success);
    assert(!AdminCreateCustomerSchema.safeParse({ name: 'Farmer', email: 'farmer@example.com', phone }).success);
  }
  assert(!AdminCreateCustomerSchema.safeParse({ name: 'Farmer', email: 'farmer@example.com' }).success);
  assert(!CompleteRegistrationSchema.safeParse({ name: 'Farmer', email: 'farmer@example.com', password: 'TestValid#987', location: 'Chennai', registrationToken: 'test' }).success);
  assert(StoreSettingsSchema.parse({ standardShippingFee: 80, freeShippingThreshold: 5000, maintenanceMode: true, maintenanceMessage: 'Back soon' }).maintenanceMode);
  console.log('PASS: expert and customer registration validation, maintenance schema');
  const googleClient = (authService as any).googleClient;
  const originalVerify = googleClient.verifyIdToken;
  const originalFind = userRepository.findByEmail;
  const originalCreate = userRepository.create;
  googleClient.verifyIdToken = async () => ({ getPayload: () => ({ sub: 'regression-google', email: 'new-google-farmer@example.com', email_verified: true, name: 'New Google Farmer' }) });
  userRepository.findByEmail = async () => null;
  userRepository.create = async () => { throw new Error('Google signup must not create an account without a phone number'); };
  try {
    const result = await authService.googleLogin('mock-verified-google-credential');
    assert('registrationToken' in result, 'New Google signups must complete registration before an account is created');
  } finally { googleClient.verifyIdToken = originalVerify; userRepository.findByEmail = originalFind; userRepository.create = originalCreate; }
  console.log('PASS: new Google signups require phone/profile completion');
  if (!process.argv.includes('--database')) return;
  assert.notEqual(process.env.NODE_ENV, 'production', 'Regression fixtures must not run in production');
  const tag = 'regression-' + crypto.randomUUID();
  const db = new PrismaClient();
  let server: ReturnType<typeof express.application.listen> | undefined;
  let customerId = ''; let otherId = ''; let categoryId = ''; let addressId = '';
  const bookingIds: string[] = [];
  const attachmentFiles: BookingAttachment[] = [];
  try {
    const customer = await db.user.create({ data: { name: 'Regression Farmer', email: `${tag}@example.com`, phone: '9876543210', emailVerified: true } });
    customerId = customer.id;
    const other = await db.user.create({ data: { name: 'Other Farmer', email: `${tag}-other@example.com`, emailVerified: true } }); otherId = other.id;
    const category = await db.category.create({ data: { name: tag, slug: tag } }); categoryId = category.id;
    const productA = await db.product.create({ data: { title: 'Low Sales', slug: `${tag}-a`, description: tag, price: 100, stock: 100, images: [], categoryId } });
    const productB = await db.product.create({ data: { title: 'High Sales', slug: `${tag}-b`, description: tag, price: 100, stock: 100, images: [], categoryId } });
    const address = await db.shippingAddress.create({ data: { fullName: customer.name, street: 'Test street', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001', country: 'India', phone: '9876543210', userId: customerId } }); addressId = address.id;
    const makeOrder = (productId: string, quantity: number, method: 'CASH_ON_DELIVERY' | 'RAZORPAY' = 'CASH_ON_DELIVERY') => db.order.create({ data: {
      userId: customerId, shippingAddressId: addressId, paymentMethod: method, paymentStatus: method === 'RAZORPAY' ? 'PAID' : 'PENDING', orderStatus: 'PROCESSING',
      itemsPrice: quantity * 100, taxPrice: 0, shippingPrice: 0, totalPrice: quantity * 100,
      items: { create: { productId, title: 'Regression item', price: 100, quantity } },
    } });
    const cod = await makeOrder(productA.id, 100);
    await makeOrder(productB.id, 5);
    const online = await makeOrder(productA.id, 100, 'RAZORPAY');
    await orderRepository.updateStatus(cod.id, 'CANCELLED');
    await db.order.update({ where: { id: online.id }, data: { orderStatus: 'CANCELLED', paymentStatus: 'REFUNDED' } });
    const all = await orderRepository.findAll({ limit: 100 });
    const cancelled = await orderRepository.findAll({ status: 'CANCELLED', limit: 100 });
    for (const id of [cod.id, online.id]) { assert(all.orders.some(order => order.id === id)); assert(cancelled.orders.some(order => order.id === id)); }
    const ranked = await productRepository.findAll({ page: 1, limit: 6, sortBy: 'best_selling', categoryId });
    assert.equal(ranked.products[0].id, productB.id, 'Cancelled sales must not inflate bestseller rank');
    console.log('PASS: cancelled COD and refunded online orders retained; sales ranking excludes cancellations');

    const app = express(); app.use(express.json()); app.use('/service-bookings', bookingsRouter); app.use('/store-settings', storeSettingsRouter); app.use('/admin', adminRouter); app.use(errorHandler);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const port = (server.address() as { port: number }).port;
    const base = `http://127.0.0.1:${port}/service-bookings`;
    const ownerHeaders = { Authorization: `Bearer ${issueSessionToken(customer, customer.password)}` };
    const otherHeaders = { Authorization: `Bearer ${issueSessionToken(other, other.password)}` };
    const admin = await db.user.findFirst({ where: { role: 'ADMIN' } });
    assert(admin, 'A seeded administrator is required for the maintenance API check');
    const adminHeaders = { Authorization: `Bearer ${issueSessionToken(admin, admin.password)}`, 'Content-Type': 'application/json' };
    const settingsUrl = `http://127.0.0.1:${port}/store-settings`;
    const settings = (await (await fetch(settingsUrl)).json() as any).data;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/admin/store-settings`, { method: 'PUT', headers: adminHeaders,
        body: JSON.stringify({ ...settings, maintenanceMode: !settings.maintenanceMode, maintenanceMessage: 'Regression maintenance notice' }) });
      assert.equal(response.status, 200, await response.clone().text());
      const publicSettings = (await (await fetch(settingsUrl)).json() as any).data;
      assert.equal(publicSettings.maintenanceMode, !settings.maintenanceMode);
      assert.equal(publicSettings.maintenanceMessage, 'Regression maintenance notice');
      const saved = await db.storeSettings.findUniqueOrThrow({ where: { id: 'store' } });
      assert.equal(saved.maintenanceMode, !settings.maintenanceMode);
    } finally {
      await db.storeSettings.update({ where: { id: 'store' }, data: { maintenanceMode: settings.maintenanceMode, maintenanceMessage: settings.maintenanceMessage } });
    }
    console.log('PASS: admin maintenance toggle persists and is returned to unauthenticated customers; original setting restored');
    for (const serviceSlug of ['crop-doctor', 'drip-irrigation', 'well-development', 'farm-development', 'farm-consultancy']) {
      const details = { growthStage: 'Vegetative', sowingDate: '2026-10-01', irrigationMethod: 'Drip', affectedPart: 'Leaves', symptomsDescription: 'Yellow patches', budget: '500000', startDate: '2026-12-01', additionalNotes: 'Preserve all details', preferredLanguage: 'Tamil', responseMethod: 'Phone', urgency: 'High' };
      const payload = { serviceSlug, serviceName: serviceSlug, name: customer.name, phone: customer.phone!, location: 'Chennai', email: customer.email, details, message: 'Regression consultation' };
      assert(CreateServiceBookingSchema.safeParse(payload).success);
      const form = new FormData(); form.append('payload', JSON.stringify(payload));
      form.append('files', new Blob([Buffer.from('89504e470d0a1a0a00000000', 'hex')], { type: 'image/png' }), 'crop.png');
      form.append('files', new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }), 'farm-plan.pdf');
      const response = await fetch(base, { method: 'POST', headers: ownerHeaders, body: form });
      assert.equal(response.status, 201, await response.clone().text());
      const { data: booking } = await response.json() as any;
      bookingIds.push(booking.id); attachmentFiles.push(...booking.attachments);
      const persisted = await db.serviceBooking.findUniqueOrThrow({ where: { id: booking.id } });
      assert.deepEqual(persisted.details, details); assert.equal((persisted.attachments as any[]).length, 2);
      const detailResponse = await fetch(`${base}/${booking.id}`, { headers: ownerHeaders });
      assert.equal(detailResponse.status, 200); assert.deepEqual((await detailResponse.json() as any).data.details, details);
      const fileUrl = `${base}/${booking.id}/attachments/${booking.attachments[0].filename}`;
      assert.equal((await fetch(fileUrl)).status, 401);
      assert.equal((await fetch(fileUrl, { headers: otherHeaders })).status, 403);
      const image = await fetch(fileUrl, { headers: ownerHeaders }); assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/png');
      assert.equal((await image.arrayBuffer()).byteLength, 12);
    }
    const invalid = new FormData(); invalid.append('payload', '{}'); invalid.append('files', new Blob(['not a PNG'], { type: 'image/png' }), 'fake.png');
    assert.equal((await fetch(base, { method: 'POST', body: invalid })).status, 400);
    console.log('PASS: all five service types persist complete details and files; attachment access restricted; spoofed files rejected');
  } finally {
    if (server) await new Promise<void>(resolve => server!.close(() => resolve()));
    await removeBookingAttachments(attachmentFiles);
    if (bookingIds.length) await db.serviceBooking.deleteMany({ where: { id: { in: bookingIds } } });
    if (customerId) { await db.order.deleteMany({ where: { userId: customerId } }); await db.shippingAddress.deleteMany({ where: { userId: customerId } }); }
    if (categoryId) await db.category.delete({ where: { id: categoryId } });
    if (customerId || otherId) await db.user.deleteMany({ where: { id: { in: [customerId, otherId].filter(Boolean) } } });
    await db.$disconnect(); await prisma.$disconnect();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
