import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    category: { name: 'Bio Stimulants', slug: 'bio-stimulants' },
    title: 'Growth Booster for All Crops 500ml',
    slug: 'growth-booster-all-crops',
    description: 'Organic seaweed and amino-acid bio-stimulant that supports stronger roots, flowering, fruit set, and crop resilience.',
    price: 580,
    discountPrice: 499,
    stock: 45,
    featured: true,
    images: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80'],
    attributes: { packSizes: ['250 ml', '500 ml', '1 L'], dosage: '2.5 ml per litre of water' },
  },
  {
    category: { name: 'Bio Pesticides', slug: 'bio-pesticides' },
    title: 'Neem Oil 100% Cold Pressed 1L',
    slug: 'neem-oil-cold-pressed',
    description: 'Cold-pressed neem oil formulated for natural protection against sucking and chewing insect pests.',
    price: 780,
    discountPrice: 699,
    stock: 35,
    featured: true,
    images: ['https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80'],
    attributes: { packSizes: ['250 ml', '500 ml', '1 L'], dosage: '3-5 ml per litre of water' },
  },
  {
    category: { name: 'Bio Fertilizers', slug: 'bio-fertilizers' },
    title: 'Humic Power Soil Conditioner 1kg',
    slug: 'humic-power-soil-conditioner',
    description: 'Water-soluble potassium humate flakes that improve soil structure, nutrient uptake, and root development.',
    price: 390,
    discountPrice: 340,
    stock: 60,
    featured: true,
    images: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80'],
    attributes: { packSizes: ['500 g', '1 kg', '5 kg'], dosage: '1 kg per acre' },
  },
  {
    category: { name: 'Crop Nutrition', slug: 'crop-nutrition' },
    title: 'Chelated Micronutrient Fertilizer 1kg',
    slug: 'chelated-micronutrient-fertilizer',
    description: 'Balanced EDTA-chelated zinc, iron, boron, manganese, copper, and molybdenum for rapid nutrient correction.',
    price: 520,
    discountPrice: 475,
    stock: 28,
    featured: false,
    images: ['https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80'],
    attributes: { packSizes: ['500 g', '1 kg', '5 kg'], dosage: '1.5 g per litre of water' },
  },
  {
    category: { name: 'Seeds', slug: 'seeds' },
    title: 'Certified Organic Paddy Seeds (BPT-5204) 10kg',
    slug: 'certified-organic-paddy-seeds-bpt-5204',
    description: 'Foundation-grade Samba Mahsuri paddy seed with high germination, fine grain quality, and blast tolerance.',
    price: 980,
    discountPrice: 890,
    stock: 15,
    featured: true,
    images: ['https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80'],
    attributes: { packSizes: ['5 kg', '10 kg', '25 kg'], germination: 'Minimum 95%' },
  },
] as const;

async function main() {
  for (const { category, ...product } of products) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { ...product, categoryId: savedCategory.id },
      create: { ...product, categoryId: savedCategory.id },
    });
  }

  console.log(`Seeded ${products.length} products successfully.`);
}

main()
  .catch((error) => {
    console.error('Product seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
