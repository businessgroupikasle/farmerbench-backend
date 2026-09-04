import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const catalog = [
  ['Seeds', 'seeds', [['Vegetable Seeds','vegetable-seeds'],['Fruit Seeds','fruit-seeds'],['Flower Seeds','flower-seeds'],['Field Crop Seeds','field-crop-seeds']]],
  ['Seedlings & Planting Materials', 'seedlings-planting-materials', [['Fruit Seedlings','fruit-seedlings'],['Banana Plants','banana-plants'],['Watermelon','watermelon'],['Muskmelon','muskmelon']]],
  ['Fruit Plants & Trees', 'fruit-plants-trees', [['Mango','mango'],['Guava','guava'],['Other Fruit Plants','other-fruit-plants']]],
  ['Plantation Crops', 'plantation-crops', [['Coconut','coconut'],['Arecanut','arecanut'],['Pepper','pepper']]],
  ['Other Plants', 'other-plants', [['Aromatic / Utility Plants','aromatic-utility-plants']]],
  ['Organic Farming', 'organic-farming', [['Bio Fertilizers','bio-fertilizers']]],
  ['Bio Fungicides', 'bio-fungicides', [['Biological Fungicides','biological-fungicides']]],
  ['Bio Pesticides', 'bio-pesticides', [['Biological Pesticides','biological-pesticides']]],
  ['Bio Stimulants', 'bio-stimulants', [['Plant Growth / Bio Stimulants','plant-growth-bio-stimulants']]],
  ['Traps', 'traps', [['Pheromone Traps','pheromone-traps'],['Sticky Traps','sticky-traps'],['Light Traps','light-traps']]],
  ['Farm Equipment', 'farm-equipment', [['Battery Sprayers','battery-sprayers'],['Farm Tools','farm-tools']]],
] as const;

const exactMappings: Record<string, [string, string]> = {
  'trichoderma-bio-fungicide': ['bio-fungicides', 'biological-fungicides'],
  'seaweed-extract-concentrated-liquid': ['bio-stimulants', 'plant-growth-bio-stimulants'],
  'humic-power-soil-conditioner': ['bio-stimulants', 'plant-growth-bio-stimulants'],
  'certified-organic-paddy-seeds-bpt-5204': ['seeds', 'field-crop-seeds'],
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
