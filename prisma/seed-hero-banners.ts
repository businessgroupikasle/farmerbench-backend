import { HeroPage, PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const defaults = [
  { page: HeroPage.HOME, eyebrow: null, title: 'Better Farming', highlightedText: 'Starts Here', description: 'Quality agricultural products and trusted farming solutions – all in one place.', desktopImage: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1920&auto=format&fit=crop&q=85', imageAlt: 'Farmer working in a green agricultural field', primaryButtonText: 'Shop Products', primaryButtonLink: '/products', secondaryButtonText: 'Explore Services', secondaryButtonLink: '/services' },
  { page: HeroPage.ABOUT, eyebrow: 'ABOUT AgriEra', title: 'Growing Better,', highlightedText: 'Together', description: 'We help farmers access trusted agricultural products, expert guidance and practical solutions for healthier crops and better yields.', desktopImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&auto=format&fit=crop&q=85', imageAlt: 'Agricultural fields at sunrise', primaryButtonText: 'Explore Our Products', primaryButtonLink: '/products' },
  { page: HeroPage.SERVICES, eyebrow: 'EXPERT FARMING SERVICES', title: 'Practical Solutions', highlightedText: 'for Better Farming', description: 'From soil health to crop protection, our agriculture experts provide the right guidance and on-field support for every stage of your farm.', desktopImage: 'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=1920&auto=format&fit=crop&q=85', imageAlt: 'Agriculture expert inspecting crops', primaryButtonText: 'Book a Consultation', primaryButtonLink: null, secondaryButtonText: 'Talk to an Expert', secondaryButtonLink: null },
  { page: HeroPage.PRODUCTS, eyebrow: 'GREENLA AGRI STORE', title: 'Trusted Products for', highlightedText: 'Better Crops', description: 'Explore genuine crop nutrition, protection and growth solutions selected by agriculture experts.', desktopImage: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&auto=format&fit=crop&q=85', imageAlt: 'Agricultural products and crops', primaryButtonText: 'Find Products', primaryButtonLink: '/products' },
];

async function main() {
  for (const data of defaults) {
    const existing = await prisma.heroBanner.findFirst({ where: { page: data.page, sortOrder: 0 } });
    if (!existing) await prisma.heroBanner.create({ data: { ...data, sortOrder: 0, isActive: true, autoplayDuration: 5000 } });
  }
}
main().finally(() => prisma.$disconnect());
