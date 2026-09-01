import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
  const usersCount = await prisma.user.count();
  const productsCount = await prisma.product.count();
  const categoriesCount = await prisma.category.count();
  const ordersCount = await prisma.order.count();
  const reviewsCount = await prisma.review.count();
  const cartItemsCount = await prisma.cartItem.count();

  console.log('Database Counts:');
  console.log('Users:', usersCount);
  console.log('Products:', productsCount);
  console.log('Categories:', categoriesCount);
  console.log('Orders:', ordersCount);
  console.log('Reviews:', reviewsCount);
  console.log('Cart Items:', cartItemsCount);

  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
  console.log('\nUsers in DB:', users);

  const orders = await prisma.order.findMany();
  console.log('\nOrders in DB:', orders);

  await prisma.$disconnect();
}

checkDb().catch(console.error);
