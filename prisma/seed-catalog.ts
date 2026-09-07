import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const catalog = [
  ['organic farming', 'organic-farming', [['Bio fertilizers', 'bio-fertilizers'], ['Bio fungicides', 'bio-fungicides'], ['Bio pesticides', 'bio-pesticides'], ['Bio stimulants', 'bio-stimulants']]],
  ['chemical', 'chemical', []],
  ['traps', 'traps', [['Pheromone trap', 'pheromone-trap'], ['Sticky traps', 'sticky-traps'], ['Light traps', 'light-traps']]],
  ['seedlings', 'seedlings', [['Papaya', 'papaya'], ['Tissue culture banana', 'tissue-culture-banana'], ['Tuber banana', 'tuber-banana'], ['Watermelon', 'watermelon'], ['Muskmelon', 'muskmelon'], ['Fruit trees', 'fruit-trees'], ['Coconut', 'coconut'], ['Arecanut', 'arecanut'], ['Pepper', 'pepper'], ['Others', 'others']]],
  ['Seeds', 'seeds', [['Horticulture Crops', 'horticulture-crops'], ['Field Crops', 'field-crops']]],
  ['Farm equipment', 'farm-equipment', []],
] as const;

const exactMappings: Record<string, [string, string]> = {
  'trichoderma-bio-fungicide': ['organic-farming', 'bio-fungicides'],
  'seaweed-extract-concentrated-liquid': ['organic-farming', 'bio-stimulants'],
  'humic-power-soil-conditioner': ['organic-farming', 'bio-stimulants'],
  'certified-organic-paddy-seeds-bpt-5204': ['seeds', 'field-crops'],
};

async function main() {
  const ids = new Map<string, string>();
  for (const [sortOrder, [name, slug, children]] of catalog.entries()) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name, isActive: true, sortOrder },
      create: { name, slug, isActive: true, sortOrder },
    });
    ids.set(slug, category.id);
    for (const [childSort, [childName, childSlug]] of children.entries()) {
      const child = await prisma.subcategory.upsert({
        where: { slug: childSlug },
        update: { name: childName, categoryId: category.id, isActive: true, sortOrder: childSort },
        create: { name: childName, slug: childSlug, categoryId: category.id, isActive: true, sortOrder: childSort },
      });
      ids.set(childSlug, child.id);
    }
  }

  for (const [productSlug, [categorySlug, subcategorySlug]] of Object.entries(exactMappings)) {
    await prisma.product.updateMany({
      where: { slug: productSlug },
      data: { categoryId: ids.get(categorySlug)!, subcategoryId: ids.get(subcategorySlug)! },
    });
  }

  const unmapped = await prisma.product.findMany({
    where: { subcategoryId: null },
    select: { id: true, title: true, slug: true },
    orderBy: { title: 'asc' },
  });
  console.log(JSON.stringify({ categories: catalog.length, unmappedProducts: unmapped }, null, 2));
}

main().finally(() => prisma.$disconnect());
