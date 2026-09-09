import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FarmerBench database seed...');

  // 1. Clean existing records in correct relation order
  await prisma.otp.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Create Super Admin User Only
  const defaultPassword = await bcrypt.hash('DemoPass123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@formerbench.dev',
      name: 'Arun (Super Admin)',
      password: defaultPassword,
      role: Role.ADMIN,
      phone: '+91 98400 12345',
      emailVerified: true,
      location: 'Chennai Headquarters',
      crops: 'Enterprise Admin',
      status: 'Active',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('👑 Created Super Admin (admin@formerbench.dev).');

  // 3. Create the admin catalog category and subcategory hierarchy
  const categorySeedData = [
    {
      name: 'organic farming',
      slug: 'organic-farming',
      description: 'Organic farming inputs, bio fertilizers, fungicides, pesticides, and stimulants.',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      subcategories: [
        ['Bio fertilizers', 'bio-fertilizers'],
        ['Bio fungicides', 'bio-fungicides'],
        ['Bio pesticides', 'bio-pesticides'],
        ['Bio stimulants', 'bio-stimulants'],
      ],
    },
    {
      name: 'chemical',
      slug: 'chemical',
      description: 'Chemical crop solutions and agricultural chemicals.',
      imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
      subcategories: [],
    },
    {
      name: 'traps',
      slug: 'traps',
      description: 'Agricultural pest control traps including pheromone, sticky, and light traps.',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
      subcategories: [
        ['Pheromone trap', 'pheromone-trap'],
        ['Sticky traps', 'sticky-traps'],
        ['Light traps', 'light-traps'],
      ],
    },
    {
      name: 'seedlings',
      slug: 'seedlings',
      description: 'Horticultural and plantation seedlings, tissue culture plants, and fruit trees.',
      imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      subcategories: [
        ['Papaya', 'papaya'],
        ['Tissue culture banana', 'tissue-culture-banana'],
        ['Tuber banana', 'tuber-banana'],
        ['Watermelon', 'watermelon'],
        ['Muskmelon', 'muskmelon'],
        ['Fruit trees', 'fruit-trees'],
        ['Coconut', 'coconut'],
        ['Arecanut', 'arecanut'],
        ['Pepper', 'pepper'],
        ['Others', 'others'],
      ],
    },
    {
      name: 'Seeds',
      slug: 'seeds',
      description: 'High-viability certified seeds for horticulture and field crops.',
      imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
      subcategories: [
        ['Horticulture Crops', 'horticulture-crops'],
        ['Field Crops', 'field-crops'],
      ],
    },
    {
      name: 'Farm equipment',
      slug: 'farm-equipment',
      description: 'Modern agricultural machinery, implements, and farm equipment.',
      imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
      subcategories: [],
    },
  ] as const;

  const categoryMap = new Map<string, any>();
  const subcategoryMap = new Map<string, any>();

  for (const [sortOrder, item] of categorySeedData.entries()) {
    const category = await prisma.category.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        imageUrl: item.imageUrl,
        sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(item.slug, category);

    for (const [childSortOrder, [name, slug]] of item.subcategories.entries()) {
      const subcategory = await prisma.subcategory.create({
        data: {
          categoryId: category.id,
          name,
          slug,
          sortOrder: childSortOrder,
          isActive: true,
        },
      });
      subcategoryMap.set(slug, subcategory);
    }
  }

  console.log(`Seeded ${categoryMap.size} agricultural categories and ${subcategoryMap.size} subcategories.`);

  // Products and blog posts are managed through the CMS and are intentionally not seeded.

  console.log('✅ Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
