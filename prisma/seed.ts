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
  await prisma.product.deleteMany();
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

  // 3. Create Authentic FarmerBench Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Bio Stimulants',
        slug: 'bio-stimulants',
        description: 'Plant growth activators, microbial extracts, and botanical bio-stimulants.',
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bio Fertilizers',
        slug: 'bio-fertilizers',
        description: '100% natural organic humic conditioners, amino acids, and micronutrients.',
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bio Pesticides',
        slug: 'bio-pesticides',
        description: 'Cold-pressed botanical neem oils and beneficial biological disease shields.',
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Crop Nutrition',
        slug: 'crop-nutrition',
        description: 'Chelated multi-micronutrients, seaweed marine minerals, and soil revitalizers.',
        imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Seeds',
        slug: 'seeds',
        description: 'High-viability foundation paddy, pulses, and organic vegetable seed stocks.',
        imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Tools & Equipment',
        slug: 'tools-equipment',
        description: 'Agricultural sprayers, soil testing kits, and smart irrigation instruments.',
        imageUrl: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
      },
    }),
  ]);

  const [bioStimulants, fertilizers, bioPesticides, cropNutrition, seeds, tools] = categories;
  console.log(`📦 Seeded ${categories.length} agricultural categories.`);

  // 4. Create Authentic FarmerBench Agricultural Products
  const products = [
    {
      title: 'Growth Booster for All Crops 500ml',
      slug: 'growth-booster-all-crops',
      description: 'Advanced organic botanical bio-stimulant engineered with bio-fermented seaweed extract and fulvic amino acids. Accelerates tillering, branching, and fruit-set while building stress resistance against heat and drought.',
      price: 580.0,
      discountPrice: 499.0,
      stock: 45,
      rating: 4.9,
      numReviews: 48,
      featured: true,
      categoryId: bioStimulants.id,
      images: [
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Cold Fermented Seaweed & Amino Acid Matrix',
          'Accelerates root elongation and vegetative branching',
          'Enhances flower retention and uniform fruit-setting',
          'Builds climate resilience against drought & heat waves',
        ],
        packSizes: ['250 ml', '500 ml', '1 L', '5 L'],
        benefits: [
          'Enhances chlorophyll synthesis and photosynthesis rate.',
          'Increases total crop yield by 20% to 35%.',
          'Certified 100% organic and residue-free for export crops.',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Measure', description: 'Take 2.5 ml of Growth Booster per Litre of clean water.' },
          { stepNumber: 2, title: 'Mix', description: 'Shake thoroughly until completely dissolved in spray tank.' },
          { stepNumber: 3, title: 'Foliar Spray', description: 'Spray during early morning or late evening for optimum absorption.' },
        ],
        dosageTable: [
          { crop: 'Paddy / Rice', foliarSpray: '2.5 ml / Litre', dripIrrigation: '500 ml / Acre' },
          { crop: 'Vegetables & Chillies', foliarSpray: '2.0 ml / Litre', dripIrrigation: '500 ml / Acre' },
          { crop: 'Fruit Orchards (Mango, Banana)', foliarSpray: '3.0 ml / Litre', dripIrrigation: '1 L / Acre' },
          { crop: 'Cotton & Pulses', foliarSpray: '2.5 ml / Litre', dripIrrigation: '750 ml / Acre' },
        ],
        ingredients: 'Cold-fermented Ascophyllum Nodosum (25%), Fulvic Peptides (12%), Plant L-Amino Acids (15%), Soluble K2O (5%).',
        specifications: [
          { label: 'Product Type', value: 'Botanical Bio-Stimulant' },
          { label: 'Form', value: 'Liquid Concentrate' },
          { label: 'Suitable Crops', value: 'All Agricultural & Horticultural Crops' },
          { label: 'Application Method', value: 'Foliar Spray / Drip Fertigation' },
          { label: 'Shelf Life', value: '24 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Bio Solutions Pvt Ltd' },
        ],
        faqs: [
          { question: 'Can I mix Growth Booster with chemical fertilizers?', answer: 'Yes, it is compatible with most standard water-soluble fertilizers.' },
          { question: 'What is the optimal frequency of spray?', answer: 'Spray every 15-20 days during vegetative, flowering, and fruit-setting stages.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
          afterImage: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before Application (Day 0)',
          afterTag: 'After 3 Weeks (Day 21)',
          disclaimer: '*Results observed on paddy crop under standard agronomic practices in Thanjavur.',
        },
      },
    },
    {
      title: 'Neem Oil 100% Cold Pressed 1L',
      slug: 'neem-oil-cold-pressed',
      description: 'High-purity botanical bio-pesticide cold-pressed from selected Azadirachta indica seeds with 10,000 PPM Azadirachtin. Provides broad-spectrum natural protection against chewing and sucking insect pests.',
      price: 780.0,
      discountPrice: 699.0,
      stock: 35,
      rating: 4.8,
      numReviews: 62,
      featured: true,
      categoryId: bioPesticides.id,
      images: [
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Pure 10,000 PPM Azadirachtin Bio-Pesticide',
          'Repels sucking pests, whiteflies, and aphids',
          'Leaves zero chemical residues on harvested produce',
          'Completely safe for earthworms and honeybees',
        ],
        packSizes: ['250 ml', '500 ml', '1 L', '5 L'],
        benefits: [
          'Interrupts insect hormone and feeding cycle.',
          'Provides excellent systemic and contact pest prevention.',
          'Certified residue-free for export vegetable and fruit crops.',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Measure', description: 'Take 3-5 ml per Litre of water.' },
          { stepNumber: 2, title: 'Emulsify', description: 'Mix with a few drops of organic surfactant.' },
          { stepNumber: 3, title: 'Spray', description: 'Thoroughly spray early morning or late evening.' },
        ],
        dosageTable: [
          { crop: 'Vegetables & Cotton', foliarSpray: '4.0 ml / Litre', dripIrrigation: 'N/A' },
          { crop: 'Fruit Orchards', foliarSpray: '5.0 ml / Litre', dripIrrigation: 'N/A' },
        ],
        ingredients: '100% Pure Cold Pressed Neem Kernel Extract (Azadirachtin 10000 PPM).',
        specifications: [
          { label: 'Product Type', value: 'Botanical Bio-Pesticide' },
          { label: 'Form', value: 'Emulsifiable Concentrate' },
          { label: 'Suitable Crops', value: 'Cotton, Chillies, Vegetables, Mango' },
          { label: 'Application Method', value: 'Foliar Spray' },
          { label: 'Shelf Life', value: '24 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Bio Tech' },
        ],
        faqs: [
          { question: 'When is the best time to spray?', answer: 'Early morning before 9 AM or late evening after 5 PM.' },
        ],
      },
    },
    {
      title: 'Humic Power Soil Conditioner 1kg',
      slug: 'humic-power-soil-conditioner',
      description: 'Potassium humate flakes (98% active humic & fulvic acids) designed to revitalize degraded soil structure, elevate cation exchange capacity (CEC), and multiply beneficial micro-flora.',
      price: 390.0,
      discountPrice: 340.0,
      stock: 60,
      rating: 4.7,
      numReviews: 36,
      featured: true,
      categoryId: fertilizers.id,
      images: [
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          '98% High-Grade Potassium Humate Flakes',
          'Improves soil water retention and aerated structure',
          'Accelerates root elongation and seedling vigor',
          'Reduces chemical fertilizer requirement by 25%',
        ],
        packSizes: ['500 g', '1 kg', '5 kg', '25 kg'],
        benefits: [
          'Converts locked phosphorus and potash into plant-absorbable forms.',
          'Increases organic carbon levels in agricultural soil.',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Measure', description: '1 kg per acre for soil drench or broadcasting.' },
          { stepNumber: 2, title: 'Mix', description: 'Mix with farmyard manure or dissolve in water.' },
          { stepNumber: 3, title: 'Apply', description: 'Broadcast evenly during basal tillage or fertigation.' },
        ],
        dosageTable: [
          { crop: 'Field Crops & Cereals', foliarSpray: '1.5 g / Litre', dripIrrigation: '1 kg / Acre' },
          { crop: 'Vegetables & Spices', foliarSpray: '2.0 g / Litre', dripIrrigation: '1.5 kg / Acre' },
        ],
        ingredients: 'Potassium Humate 98%, Fulvic Acid 15%, K2O 10%.',
        specifications: [
          { label: 'Product Type', value: 'Organic Soil Conditioner' },
          { label: 'Form', value: 'Shiny Black Flakes / 100% Soluble' },
          { label: 'Suitable Crops', value: 'Paddy, Sugarcane, Banana, Groundnut' },
          { label: 'Application Method', value: 'Soil Application & Drip' },
          { label: 'Shelf Life', value: '36 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Soil Lab' },
        ],
        faqs: [
          { question: 'Is it completely water soluble?', answer: 'Yes, dissolves 100% without leaving residue.' },
        ],
      },
    },
    {
      title: 'Bio Power Plant Promoter 500ml',
      slug: 'bio-power-plant-promoter',
      description: 'Potent microbiological microbial consortium that activates symbiotic rhizobacteria around roots, enhancing nitrogen fixation and vegetative shoot elongation.',
      price: 450.0,
      discountPrice: 399.0,
      stock: 18,
      rating: 4.8,
      numReviews: 19,
      featured: true,
      categoryId: bioStimulants.id,
      images: [
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Active Beneficial Rhizobacteria Consortium',
          'Accelerates Chlorophyll Synthesis',
          'Promotes Higher Flowering & Tillering',
        ],
        packSizes: ['250 ml', '500 ml', '1 L'],
        benefits: ['Boosts biological soil activity.', 'Enhances crop flowering.'],
        usageSteps: [
          { stepNumber: 1, title: 'Measure', description: '2 ml per Litre.' },
          { stepNumber: 2, title: 'Mix', description: 'Dissolve in water.' },
          { stepNumber: 3, title: 'Apply', description: 'Spray at 20-30 day crop intervals.' },
        ],
        dosageTable: [{ crop: 'All Crops', foliarSpray: '2 ml / Litre', dripIrrigation: '500 ml / Acre' }],
        ingredients: 'Microbial bio-ferment broth with plant peptides.',
        specifications: [
          { label: 'Product Type', value: 'Bio-Promoter' },
          { label: 'Form', value: 'Liquid' },
          { label: 'Suitable Crops', value: 'All Crops' },
          { label: 'Shelf Life', value: '18 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Bio Tech' },
        ],
        faqs: [{ question: 'Can it be applied on vegetables?', answer: 'Yes, ideal for all vegetable crops.' }],
      },
    },
    {
      title: 'Trichoderma Bio-Fungicide 1kg',
      slug: 'trichoderma-bio-fungicide',
      description: 'Antagonistic biocontrol fungus (Trichoderma viride 2x10^8 CFU/g) that protects crops against root rot, collar rot, damping off, wilt (Fusarium), and powdery mildew.',
      price: 480.0,
      discountPrice: 440.0,
      stock: 22,
      rating: 4.8,
      numReviews: 24,
      featured: false,
      categoryId: bioPesticides.id,
      images: [
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Biological Root & Wilt Shield (2x10^8 CFU/g)',
          'Effective against Fusarium wilt & damping off',
          'Naturally colonizes rhizosphere for long-term protection',
        ],
        packSizes: ['1 kg', '5 kg'],
        benefits: ['Shields roots against fungal pathogens.', 'Non-toxic biological defense.'],
        usageSteps: [
          { stepNumber: 1, title: 'Seed Treatment', description: '10g per kg of seeds.' },
          { stepNumber: 2, title: 'Soil Application', description: '2.5 kg per acre mixed with organic manure.' },
          { stepNumber: 3, title: 'Apply', description: 'Broadcast or drench near root zone.' },
        ],
        dosageTable: [{ crop: 'Paddy, Pulses, Vegetables', foliarSpray: 'N/A', dripIrrigation: '2.5 kg / Acre' }],
        ingredients: 'Trichoderma viride viable spores (2 x 10^8 CFU/gm min).',
        specifications: [
          { label: 'Product Type', value: 'Bio-Fungicide' },
          { label: 'Form', value: 'Wettable Powder' },
          { label: 'Suitable Crops', value: 'Pulses, Chillies, Paddy, Cotton' },
          { label: 'Shelf Life', value: '12 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Biocontrol Lab' },
        ],
        faqs: [{ question: 'Can it be mixed with chemical fungicides?', answer: 'No, avoid mixing with synthetic chemical fungicides.' }],
      },
    },
    {
      title: 'Seaweed Extract Concentrated Liquid 500ml',
      slug: 'seaweed-extract-concentrated-liquid',
      description: 'Naturally harvested Ascophyllum nodosum cold-fermented seaweed extract providing over 60 minerals, cytokinins, auxins, and gibberellins for vigorous vegetative branching.',
      price: 650.0,
      discountPrice: 580.0,
      stock: 52,
      rating: 4.9,
      numReviews: 31,
      featured: false,
      categoryId: bioStimulants.id,
      images: [
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Cold Fermented Ascophyllum Nodosum Marine Algae',
          'Rich in Phytohormones & Over 60 Trace Minerals',
          'Enhances Photosynthetic Efficiency & Fruit Size',
        ],
        packSizes: ['250 ml', '500 ml', '1 L'],
        benefits: ['Elevates chlorophyll levels.', 'Promotes uniform fruit size and weight.'],
        usageSteps: [
          { stepNumber: 1, title: 'Measure', description: '2 ml per Litre of water.' },
          { stepNumber: 2, title: 'Mix', description: 'Mix thoroughly.' },
          { stepNumber: 3, title: 'Spray', description: 'Foliar spray during vegetative and flowering.' },
        ],
        dosageTable: [{ crop: 'All Crops', foliarSpray: '2 ml / Litre', dripIrrigation: '500 ml / Acre' }],
        ingredients: 'Pure marine brown algae extract (Ascophyllum Nodosum 100%).',
        specifications: [
          { label: 'Product Type', value: 'Organic Biostimulant' },
          { label: 'Form', value: 'Liquid' },
          { label: 'Shelf Life', value: '24 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Marine Labs' },
        ],
        faqs: [{ question: 'Is it suitable for organic farming?', answer: 'Yes, 100% organic certified.' }],
      },
    },
    {
      title: 'Chelated Micronutrient Fertilizer 1kg',
      slug: 'chelated-micronutrient-fertilizer',
      description: 'Multi-micronutrient EDTA chelated formulation delivering balanced Zinc (Zn), Iron (Fe), Boron (B), Manganese (Mn), Copper (Cu), and Molybdenum (Mo) in 100% bio-available form.',
      price: 520.0,
      discountPrice: 475.0,
      stock: 28,
      rating: 4.6,
      numReviews: 14,
      featured: false,
      categoryId: cropNutrition.id,
      images: [
        'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          '100% EDTA Chelated Multi-Micronutrients',
          'Rapidly cures yellowing (chlorosis) & leaf mottle',
          'Enhances flower retention and pollination efficiency',
        ],
        packSizes: ['500 g', '1 kg', '5 kg'],
        benefits: ['Corrects micro-element deficiencies immediately.', 'Enhances test weight of grains.'],
        usageSteps: [
          { stepNumber: 1, title: 'Measure', description: '1.5 g per Litre.' },
          { stepNumber: 2, title: 'Mix', description: 'Dissolve in water.' },
          { stepNumber: 3, title: 'Spray', description: 'Foliar spray when leaves show deficiency.' },
        ],
        dosageTable: [{ crop: 'All Horticultural Crops', foliarSpray: '1.5 g / Litre', dripIrrigation: '500 g / Acre' }],
        ingredients: 'Zn 3%, Fe 2%, Mn 1%, Cu 0.5%, B 0.5%, Mo 0.05% (EDTA Chelated).',
        specifications: [
          { label: 'Product Type', value: 'Micronutrient Blend' },
          { label: 'Form', value: 'Powder' },
          { label: 'Shelf Life', value: '36 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Nutrition' },
        ],
        faqs: [{ question: 'Can it be sprayed during flowering?', answer: 'Yes, highly recommended at flower bud stage.' }],
      },
    },
    {
      title: 'Certified Organic Paddy Seeds (BPT-5204) 10kg',
      slug: 'certified-organic-paddy-seeds-bpt-5204',
      description: 'High-viability foundation paddy seed (BPT 5204 / Samba Mahsuri) with 95%+ germination rate. Highly prized for premium grain quality, excellent cooking aroma, and resistance to blast disease.',
      price: 980.0,
      discountPrice: 890.0,
      stock: 15,
      rating: 4.9,
      numReviews: 22,
      featured: true,
      categoryId: seeds.id,
      images: [
        'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Foundation Grade Samba Mahsuri (BPT 5204)',
          '95%+ Tested Field Germination Rate',
          'High Market Value Fine-Grain Variety',
        ],
        packSizes: ['5 kg', '10 kg', '25 kg'],
        benefits: ['Superb cooking quality and high yield.', 'Strong blast tolerance.'],
        usageSteps: [
          { stepNumber: 1, title: 'Seed Soaking', description: 'Soak in water with Trichoderma for 24 hours.' },
          { stepNumber: 2, title: 'Incubation', description: 'Incubate seeds in moist gunny bag for sprouting.' },
          { stepNumber: 3, title: 'Nursery Sowing', description: 'Broadcast uniformly on prepared nursery bed.' },
        ],
        dosageTable: [{ crop: 'Paddy', foliarSpray: 'N/A', dripIrrigation: 'N/A' }],
        ingredients: 'Pure certified organic paddy grains (BPT 5204).',
        specifications: [
          { label: 'Product Type', value: 'Certified Seeds' },
          { label: 'Duration', value: '145-150 Days' },
          { label: 'Germination', value: 'Min 95%' },
          { label: 'Shelf Life', value: '9 Months' },
          { label: 'Manufacturer', value: 'FarmerBench Seed Farms' },
        ],
        faqs: [{ question: 'What is the duration of this variety?', answer: '145 to 150 days (Medium duration).' }],
      },
    },
  ];

  for (const prod of products) {
    await prisma.product.create({
      data: prod,
    });
  }

  console.log(`🌾 Seeded ${products.length} authentic FarmerBench agricultural products with complete CMS attributes.`);
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
