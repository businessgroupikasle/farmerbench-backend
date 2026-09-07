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

  // 4. Create Authentic FarmerBench Agricultural Products
  const products = [
    {
      title: 'Growth Booster for All Crops 500ml',
      slug: 'growth-booster-all-crops',
      description: 'Advanced organic botanical bio-stimulant engineered with bio-fermented seaweed extract and fulvic amino acids. Accelerates tillering, branching, and fruit-set while building stress resistance against heat and drought.',
      price: 580.0,
      discountPrice: 499.0,
      stock: 45,
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('organic-farming')!.id,
      subcategoryId: subcategoryMap.get('bio-stimulants')!.id,
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
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('organic-farming')!.id,
      subcategoryId: subcategoryMap.get('bio-pesticides')!.id,
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
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('organic-farming')!.id,
      subcategoryId: subcategoryMap.get('bio-fertilizers')!.id,
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
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('organic-farming')!.id,
      subcategoryId: subcategoryMap.get('bio-stimulants')!.id,
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
      rating: 0,
      numReviews: 0,
      featured: false,
      categoryId: categoryMap.get('organic-farming')!.id,
      subcategoryId: subcategoryMap.get('bio-fungicides')!.id,
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
      rating: 0,
      numReviews: 0,
      featured: false,
      categoryId: categoryMap.get('organic-farming')!.id,
      subcategoryId: subcategoryMap.get('bio-stimulants')!.id,
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
      rating: 0,
      numReviews: 0,
      featured: false,
      categoryId: categoryMap.get('chemical')!.id,
      subcategoryId: null,
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
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('seeds')!.id,
      subcategoryId: subcategoryMap.get('field-crops')!.id,
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
    {
      title: 'Pheromone Trap for Fall Armyworm & Stem Borer',
      slug: 'pheromone-trap-fall-armyworm',
      description: 'UV-stabilized funnel pheromone trap equipped with species-specific high-attraction lure for maize fall armyworm and paddy stem borer monitoring and mass trapping.',
      price: 320.0,
      discountPrice: 280.0,
      stock: 50,
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('traps')!.id,
      subcategoryId: subcategoryMap.get('pheromone-trap')!.id,
      images: [
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'UV-Stabilized All-Weather Polypropylene',
          'High-Potency 90-Day Attractant Lure Included',
          'Zero Chemical Contact with Food Crops',
        ],
        packSizes: ['1 Unit', '5 Units', '10 Units'],
        benefits: ['Early warning pest detection.', 'Reduces pest population non-toxically.'],
        specifications: [
          { label: 'Product Type', value: 'Pheromone Trap' },
          { label: 'Target Pests', value: 'Fall Armyworm, Spodoptera, Stem Borer' },
          { label: 'Lure Duration', value: '90 Days' },
        ],
      },
    },
    {
      title: 'Yellow & Blue Sticky Traps (Pack of 20)',
      slug: 'yellow-blue-sticky-traps-pack-20',
      description: 'Double-sided waterproof adhesive insect sheets engineered with specific optical spectrum to attract whiteflies, thrips, aphids, and leaf miners in open fields and greenhouses.',
      price: 260.0,
      discountPrice: 220.0,
      stock: 75,
      rating: 0,
      numReviews: 0,
      featured: false,
      categoryId: categoryMap.get('traps')!.id,
      subcategoryId: subcategoryMap.get('sticky-traps')!.id,
      images: [
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Double-Sided Non-Drying Optical Adhesive',
          'Rain and Sun Heat Resistant',
          'Safe for Beneficial Pollinators',
        ],
        packSizes: ['Pack of 20', 'Pack of 50'],
        benefits: ['Continuous round-the-clock pest catching.', 'Chemical-free crop security.'],
        specifications: [
          { label: 'Product Type', value: 'Sticky Insect Traps' },
          { label: 'Pack Size', value: '10 Yellow + 10 Blue' },
        ],
      },
    },
    {
      title: 'Papaya Taiwan 786 Red Lady Seedlings (Tray of 104)',
      slug: 'papaya-taiwan-786-seedlings-tray-104',
      description: 'Vigorous disease-free F1 hybrid Red Lady 786 papaya seedlings grown in sterilized cocopeat germination trays. Produces early-bearing hermaphrodite fruits with deep red, sweet pulp.',
      price: 1250.0,
      discountPrice: 1100.0,
      stock: 40,
      rating: 0,
      numReviews: 0,
      featured: true,
      categoryId: categoryMap.get('seedlings')!.id,
      subcategoryId: subcategoryMap.get('papaya')!.id,
      images: [
        'https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Genuine Known-You Taiwan 786 F1 Hybrid',
          'Uniform Rooting in Sterilized 104-Cell Tray',
          'High PRSV Virus Tolerance & Heavy Bearing',
        ],
        packSizes: ['Tray of 104 Plantlets'],
        benefits: ['High brix sweetness (13-14%) and excellent shipping shelf life.', 'Starts flowering in 5 months.'],
        specifications: [
          { label: 'Product Type', value: 'Horticultural Seedlings' },
          { label: 'Variety', value: 'Taiwan 786 Red Lady' },
          { label: 'Age', value: '35-40 Days Hardened' },
        ],
      },
    },
    {
      title: 'Tissue Culture Banana Grand Naine Plantlets (Pack of 20)',
      slug: 'tissue-culture-banana-grand-naine',
      description: 'Secondary hardened certified virus-indexed Grand Naine (G-9) Cavendish banana tissue culture plantlets. Delivers uniform bunches averaging 25-35 kg per tree.',
      price: 900.0,
      discountPrice: 820.0,
      stock: 30,
      rating: 0,
      numReviews: 0,
      featured: false,
      categoryId: categoryMap.get('seedlings')!.id,
      subcategoryId: subcategoryMap.get('tissue-culture-banana')!.id,
      images: [
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Virus-Indexed Secondary Hardened TC Banana',
          'Uniform Synchronized Maturity Cycle (11-12 Months)',
          'Heavy Bunch Weight (25 - 35 kg / Plant)',
        ],
        packSizes: ['Pack of 20 Plantlets', 'Pack of 50 Plantlets'],
        benefits: ['Higher bunch yield than traditional suckers.', 'Uniform harvest window.'],
        specifications: [
          { label: 'Product Type', value: 'Tissue Culture Seedlings' },
          { label: 'Variety', value: 'Grand Naine (G9)' },
        ],
      },
    },
    {
      title: 'F1 Hybrid Tomato Seeds (Arka Rakshak) 10g',
      slug: 'f1-hybrid-tomato-seeds-arka-rakshak',
      description: 'High-yielding triple disease resistant (ToLCV + BW + Early Blight) commercial hybrid tomato seed developed by IIHR. Ideal for open field commercial horticulture cultivation.',
      price: 450.0,
      discountPrice: 395.0,
      stock: 45,
      rating: 0,
      numReviews: 0,
      featured: false,
      categoryId: categoryMap.get('seeds')!.id,
      subcategoryId: subcategoryMap.get('horticulture-crops')!.id,
      images: [
        'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Triple Disease Resistant Commercial F1 Hybrid',
          'Firm, Deep Red Round Fruits (90-100g each)',
          'High Yield Potential up to 35-40 Tons/Acre',
        ],
        packSizes: ['10 g', '50 g'],
        benefits: ['Exceptional fruit firmness for long-distance transport.', 'Requires fewer pesticide sprays.'],
        specifications: [
          { label: 'Product Type', value: 'Horticulture Crop Seeds' },
          { label: 'Germination', value: 'Min 85%' },
        ],
      },
    },
  ];

  for (const prod of products) {
    await prisma.product.create({
      data: prod,
    });
  }

  console.log(`🌾 Seeded ${products.length} authentic FarmerBench agricultural products with complete CMS attributes.`);

  // 5. Seed Authentic Agriculture Blog Articles
  const blogs = [
    {
      title: 'How to Choose the Right Fertilizer for Your Crop?',
      slug: 'how-to-choose-the-right-fertilizer-for-your-crop',
      excerpt: 'A comprehensive guide on evaluating NPK ratios, soil pH testing, and balancing organic compost with targeted micronutrient feeding.',
      content: `<p>Choosing the right fertilizer is one of the most critical decisions for achieving vigorous crop growth, robust root architecture, and maximum seasonal harvest. Different crops require distinct nutrient proportions at key developmental stages—from vegetative leaf expansion to flower initiation and fruit setting.</p>

<h2 class="blog-section-heading">1. Understanding Your Crop's Nutrient Needs</h2>
<p>Every crop requires a balanced formulation of primary macronutrients—Nitrogen (N), Phosphorus (P), and Potassium (K)—supplemented by secondary and micronutrients such as Calcium, Magnesium, Zinc, and Boron. For instance, leafy greens require elevated Nitrogen for chlorophyll synthesis, while root vegetables and fruiting crops demand higher Phosphorus and Potassium levels for root elongation and cellular sugar transport.</p>

<h2 class="blog-section-heading">2. Know the Main Fertilizer Categories</h2>
<p>Fertilizers are classified into three primary categories depending on their source and release mechanisms:</p>
<ul class="blog-article-list">
  <li><strong>Organic & Bio-Fertilizers:</strong> Formulated from microbial inoculants, seaweed extracts, and fermented compost that replenish organic carbon and boost mycorrhizal root colonization.</li>
  <li><strong>Inorganic Mineral Fertilizers:</strong> Highly soluble formulations engineered for rapid bioavailability and immediate correction of acute nutrient deficiencies.</li>
  <li><strong>Slow-Release Humic Blends:</strong> Bio-stimulated granules coated with humic and fulvic acids to prevent nitrogen leaching and volatilization.</li>
</ul>

<div class="blog-expert-tip-box">
  <div class="blog-tip-icon">💡</div>
  <div>
    <h4 class="blog-tip-title">Expert Agronomist Tip</h4>
    <p class="blog-tip-text">Combining humic acid granules with inorganic fertilizer reduces overall chemical application rates by up to 25% while enhancing fertilizer uptake efficiency.</p>
  </div>
</div>

<h2 class="blog-section-heading">3. Decoding the NPK Ratio</h2>
<p>The three numbers printed on fertilizer packaging indicate the percentage concentration of Nitrogen (N), Phosphate (P₂O₅), and Potash (K₂O). For example, a <strong>10-26-26</strong> ratio delivers 10% Nitrogen for controlled vegetative foliage and 26% each of Phosphorus and Potassium to support prolific flowering and seed development.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&auto=format&fit=crop&q=80',
      author: 'Dr. Ramesh Kumar',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      authorBio: 'Senior Soil Scientist and Agronomist with over 15 years of field consultancy across South India.',
      category: 'Crop Nutrition',
      tags: ['Crop Nutrition', 'Fertilizer', 'NPK Guide', 'Soil Fertility'],
      status: 'PUBLISHED' as const,
      readingTime: '5 min read',
      views: 1420,
      publishedAt: new Date('2024-05-18T10:00:00.000Z'),
      metaTitle: 'How to Choose the Right Fertilizer for Your Crop | AgriEra',
      metaDescription: 'Master NPK ratios, organic bio-fertilizers, and micronutrient feeding for maximum crop yields.',
    },
    {
      title: 'Simple Ways to Improve Soil Health Naturally',
      slug: 'simple-ways-to-improve-soil-health-naturally',
      excerpt: 'Revitalize degraded farmland using green cover crops, biochar amendments, and reduced tillage strategies.',
      content: `<p>Healthy soil is a living biological ecosystem teeming with billions of beneficial fungi, actinomycetes, and earthworms. Rebuilding degraded soil organic matter restores natural water retention and reduces reliance on chemical fertilizers.</p>

<h2 class="blog-section-heading">1. Incorporating Green Manure & Cover Crops</h2>
<p>Sowing leguminous cover crops such as Sunn Hemp, Sesbania, or Cowpea during fallow periods fixes atmospheric nitrogen directly into the soil profile. Tilling these crops back into the topsoil prior to flowering adds immense organic biomass.</p>

<h2 class="blog-section-heading">2. Application of Vermicompost & Biochar</h2>
<p>Vermicompost supplies millions of beneficial bacteria, actinomycetes, and enzymes. When combined with biochar, it creates permanent micropores that trap nutrients and prevent leaching during heavy monsoons.</p>

<div class="blog-expert-tip-box">
  <div class="blog-tip-icon">🌱</div>
  <div>
    <h4 class="blog-tip-title">Soil Moisture Tip</h4>
    <p class="blog-tip-text">Every 1% increase in soil organic carbon allows the soil to hold an extra 20,000 gallons of water per acre.</p>
  </div>
</div>

<h2 class="blog-section-heading">3. Minimizing Deep Tillage</h2>
<p>Frequent deep plowing disrupts earthworm tunnels and oxidizes fragile humus layers. Transitioning towards minimum tillage preserves natural fungal mycorrhizal networks.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=1200&auto=format&fit=crop&q=80',
      author: 'Dr. Ramesh Kumar',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      authorBio: 'Specialist in soil microbiology and sustainable land management with active research in bio-stimulants.',
      category: 'Soil Health',
      tags: ['Soil Health', 'Organic Farming', 'Composting', 'Regenerative Agriculture'],
      status: 'PUBLISHED' as const,
      readingTime: '6 min read',
      views: 980,
      publishedAt: new Date('2024-05-12T10:00:00.000Z'),
      metaTitle: 'Simple Ways to Improve Soil Health Naturally | AgriEra',
      metaDescription: 'Explore regenerative soil enrichment techniques, microbial inoculants, and cover cropping to rebuild topsoil vitality.',
    },
    {
      title: 'Common Crop Pests and How to Control Them Biologically',
      slug: 'common-crop-pests-and-how-to-control-them-biologically',
      excerpt: 'Identify early symptoms of sucking pests, caterpillars, and fungal blights with proven biological controls and neem formulations.',
      content: `<p>Integrated Pest Management (IPM) provides an environmentally sound approach to suppressing pest populations below economic injury levels without destroying beneficial predator insects.</p>

<h2 class="blog-section-heading">1. Identifying Sucking Pests Early</h2>
<p>Aphids, whiteflies, and thrips cause leaf curling, sooty mold, and viral transmission. Early deployment of yellow and blue sticky traps provides both monitoring and mass capture.</p>

<h2 class="blog-section-heading">2. Neem-Based Azadirachtin Sprays</h2>
<p>Cold-pressed pure neem oil formulated at 10,000 PPM disrupts insect feeding, egg-laying, and molting cycles without harming honeybees or earthworms.</p>

<h2 class="blog-section-heading">3. Biological Parasitoids and Predators</h2>
<p>Introducing beneficial insects like Trichogramma wasps and Chrysoperla lacewings naturally eliminates stem borer eggs and soft-bodied pest nymphs.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80',
      author: 'Kavitha Nathan',
      authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      authorBio: 'Plant pathologist focusing on eco-friendly botanical formulations and Integrated Pest Management.',
      category: 'Plant Protection',
      tags: ['Pest Control', 'Neem Oil', 'IPM', 'Bio Pesticides'],
      status: 'PUBLISHED' as const,
      readingTime: '7 min read',
      views: 1150,
      publishedAt: new Date('2024-05-10T10:00:00.000Z'),
      metaTitle: 'Common Crop Pests & Biological Control Guide | AgriEra',
      metaDescription: 'Complete guide to identifying agricultural pests and deploying botanical extracts and bio-fungicides.',
    },
    {
      title: 'Smart Drip Irrigation & Water Efficiency for Commercial Crops',
      slug: 'smart-drip-irrigation-and-water-efficiency',
      excerpt: 'Save up to 45% water while delivering precise nutrient doses directly to root zones using pressure-compensating drip systems.',
      content: `<p>Water scarcity and rising power costs make precision irrigation vital for modern horticulture and plantation crops. Smart micro-drip networks eliminate surface runoff and deep percolation losses.</p>

<h2 class="blog-section-heading">1. Pressure Compensating (PC) Drippers</h2>
<p>PC drippers ensure uniform discharge across undulating topography, providing each plant with the exact volumetric quota regardless of pipe pressure fluctuations.</p>

<h2 class="blog-section-heading">2. Soil Tensiometers and Automated Scheduling</h2>
<p>Deploying digital soil moisture tensiometers prevents over-irrigation, root suffocation, and fungal damping-off by triggering pumps only when root suction levels reach preset thresholds.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=1200&auto=format&fit=crop&q=80',
      author: 'Dr. Ramesh Kumar',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      authorBio: 'Agricultural engineering specialist in pressurized micro-irrigation and groundwater recharge.',
      category: 'Irrigation',
      tags: ['Irrigation', 'Water Management', 'Smart Farming', 'Drip Systems'],
      status: 'PUBLISHED' as const,
      readingTime: '5 min read',
      views: 870,
      publishedAt: new Date('2024-05-02T10:00:00.000Z'),
      metaTitle: 'Smart Drip Irrigation & Water Efficiency | AgriEra',
      metaDescription: 'Maximize water productivity with automated drip irrigation, soil moisture sensing, and root-zone fertigation.',
    },
    {
      title: 'Practices and Economics of Sustainable Agriculture',
      slug: 'practices-and-economics-of-sustainable-agriculture',
      excerpt: 'How multi-cropping, organic certification, and input reduction yield premium farm gate prices and long-term financial security.',
      content: `<p>Sustainable agriculture is not merely an ecological goal; it is a financially viable commercial model. By reducing reliance on expensive synthetic inputs and earning organic market premiums, growers achieve higher net profitability.</p>

<h2 class="blog-section-heading">1. Multi-Tier Cropping Systems</h2>
<p>Intercropping short-duration legumes beneath fruit orchards or coconut plantations provides continuous cash flow and natural weed suppression.</p>

<h2 class="blog-section-heading">2. Direct-to-Consumer & Agri-FPO Marketing</h2>
<p>Forming Farmer Producer Organizations (FPOs) eliminates middleman margins and empowers farmers with collective bargaining for wholesale bulk inputs.</p>`,
      featuredImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&auto=format&fit=crop&q=80',
      author: 'AgriEra Agri Expert',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      authorBio: 'Senior agronomist with 12+ years of on-field experience.',
      category: 'Farming Tips',
      tags: ['Sustainable Farming', 'Farming Tips', 'Agri Economics', 'FPO'],
      status: 'PUBLISHED' as const,
      readingTime: '6 min read',
      views: 940,
      publishedAt: new Date('2024-04-28T10:00:00.000Z'),
      metaTitle: 'Practices and Economics of Sustainable Agriculture | AgriEra',
      metaDescription: 'Explore actionable sustainable farming models that cut input costs and increase farm revenue.',
    },
  ];

  for (const b of blogs) {
    await prisma.blog.create({
      data: b,
    });
  }

  console.log(`📰 Seeded ${blogs.length} authentic agriculture blog articles.`);
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
