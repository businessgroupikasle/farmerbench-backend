import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestOrders() {
  console.log('Cleaning test/temp orders from database...');

  // Delete all test order items and orders
  const deletedItems = await prisma.orderItem.deleteMany();
  const deletedPayments = await prisma.payment.deleteMany();
  const deletedOrders = await prisma.order.deleteMany();
  const deletedCarts = await prisma.cartItem.deleteMany();

  console.log(`Deleted ${deletedItems.count} test order items`);
  console.log(`Deleted ${deletedPayments.count} test payments`);
  console.log(`Deleted ${deletedOrders.count} test orders`);
  console.log(`Deleted ${deletedCarts.count} test cart items`);

  await prisma.$disconnect();
}

cleanTestOrders().catch(console.error);
