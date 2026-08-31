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

  // 2. Create Default Users (Super Admin + Authentic Farmers)
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

  const farmersData = [
    {
      email: 'customer@formerbench.dev',
      name: 'Ramanathan K.',
      phone: '+91 98421 88321',
      location: 'Thanjavur, Tamil Nadu',
      crops: 'Paddy / 15 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'meena.devi@farmmail.in',
      name: 'Meena Devi',
      phone: '+91 97892 44102',
      location: 'Erode, Tamil Nadu',
      crops: 'Tomato & Vegetables / 6 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'murugan.agro@gmail.com',
      name: 'Muruganandam K.',
      phone: '+91 94432 10842',
      location: 'Erode (Delta Region)',
      crops: 'Turmeric & Coconut / 8 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'gopal.crops@gmail.com',
      name: 'Gopalakrishnan V.',
      phone: '+91 97890 33412',
      location: 'Madurai, Tamil Nadu',
      crops: 'Cotton & Chillies / 5 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'annamalai.farm@gmail.com',
      name: 'Annamalai R.',
      phone: '+91 98402 77112',
      location: 'Tirunelveli, Tamil Nadu',
      crops: 'Banana & Paddy / 15 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'meenakshi.agro@gmail.com',
      name: 'Meenakshi Sundaram',
      phone: '+91 99441 55230',
      location: 'Dindigul, Tamil Nadu',
      crops: 'Vegetables & Maize / 6 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'kavitha.agro@gmail.com',
      name: 'Kavitha Selvam',
      phone: '+91 98940 12099',
      location: 'Coimbatore, Tamil Nadu',
      crops: 'Arecanut & Coconut / 10 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      email: 'senthil.farmer@gmail.com',
      name: 'Senthil Nathan',
      phone: '+91 98421 99210',
      location: 'Salem, Tamil Nadu',
      crops: 'Tapioca & Pulses / 8 Acres',
      status: 'Verified',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const seededFarmers = [];
  for (const f of farmersData) {
    const user = await prisma.user.create({
      data: {
        email: f.email,
        name: f.name,
        password: defaultPassword,
        role: Role.CUSTOMER,
        phone: f.phone,
        emailVerified: true,
        location: f.location,
        crops: f.crops,
        status: f.status,
        avatarUrl: f.avatarUrl,
      },
    });
    seededFarmers.push(user);
  }

  const customer1 = seededFarmers[0];
  const customer2 = seededFarmers[1];

  console.log(`?? Created ${seededFarmers.length + 1} users in PostgreSQL (Super Admin + Farmers).`);

  // 3. Create Authentic FarmerBench Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Bio Stimulants',
        slug: 'bio-stimulants',
        description: 'Plant growth promoters, root energizers, seaweed extracts, and flowering catalysts.',
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Bio Pesticides',
        slug: 'bio-pesticides',
        description: 'Neem oils, trichoderma bio-fungicides, and organic biological pest protection.',
        imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fertilizers',
        slug: 'fertilizers',
        description: 'Humic power soil conditioners, vermicompost extracts, and organic mineral nutrition.',
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Crop Nutrition',
        slug: 'crop-nutrition',
        description: 'Micronutrient blends, chelated zinc, boron, and calcium foliar sprays.',
        imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Seeds & Seedlings',
        slug: 'seeds-seedlings',
        description: 'High-germination certified hybrid seeds, paddy grains, and organic produce seeds.',
        imageUrl: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Organic Produce',
        slug: 'organic-produce',
        description: 'Fresh farm-harvested organic grains, pulses, fruits, and cold-pressed oils.',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
      },
    }),
  ]);

  const [bioStimulants, bioPesticides, fertilizers, cropNutrition, seeds, organicProduce] = categories;

  console.log(`📦 Seeded ${categories.length} agricultural categories.`);

  // 4. Create 8 Authentic FarmerBench Products with Full Admin CMS Attributes
  const products = [
    {
      title: 'Growth Booster for All Crops 500ml',
      slug: 'growth-booster-for-all-crops',
      description: 'Growth Booster is a 100% organic plant nutrition formula designed to promote vigorous growth, better root development and higher yields. It is enriched with essential amino acids, trace minerals, and natural phytohormones that improve soil health and boost plant immunity naturally.',
      price: 650.0,
      discountPrice: 580.0,
      stock: 42,
      rating: 4.8,
      numReviews: 124,
      featured: true,
      categoryId: cropNutrition.id,
      images: [
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        features: [
          'Promotes faster and healthier growth',
          'Improves flowering and crop yield',
          'Supports stronger root development',
          'Suitable for all major crops',
        ],
        packSizes: ['500 g', '1 kg', '5 kg'],
        benefits: [
          'Accelerates vegetative nodal branching and healthy canopy development.',
          'Dramatically enhances lateral feeder roots for maximum moisture and phosphorus absorption.',
          'Increases tillering in paddy and prevents flower and fruit drop in vegetables and cotton.',
          'Builds natural resistance against climatic stress and intermittent drought.',
        ],
        usageSteps: [
          {
            stepNumber: 1,
            title: 'Measure',
            description: 'Take the recommended amount as per dosage.',
          },
          {
            stepNumber: 2,
            title: 'Mix',
            description: 'Mix with water thoroughly until dissolved.',
          },
          {
            stepNumber: 3,
            title: 'Apply',
            description: 'Apply to soil or as foliar spray to plants.',
          },
        ],
        dosageTable: [
          { crop: 'Paddy & Cereals', foliarSpray: '2.5 ml / Litre', dripIrrigation: '500 ml / Acre' },
          { crop: 'Cotton & Sugarcane', foliarSpray: '3.0 ml / Litre', dripIrrigation: '750 ml / Acre' },
          { crop: 'Vegetables & Pulses', foliarSpray: '2.0 ml / Litre', dripIrrigation: '500 ml / Acre' },
          { crop: 'Horticulture & Fruits', foliarSpray: '3.5 ml / Litre', dripIrrigation: '1000 ml / Acre' },
        ],
        ingredients: 'Cold-fermented seaweed extract (28%), hydrolysed vegetable proteins (14%), humic and fulvic acids (18%), micronutrient chelates (5%), organic carrier solvent Q.S.',
        specifications: [
          { label: 'Product Type', value: 'Organic' },
          { label: 'Form', value: 'Granular' },
          { label: 'Suitable Crops', value: 'All Crops' },
          { label: 'Application Method', value: 'Soil Application / Foliar Spray' },
          { label: 'Shelf Life', value: '24 Months' },
          { label: 'Manufacturer', value: 'Greenla Agri Solutions' },
        ],
        faqs: [
          {
            question: 'Can I use this product in drip irrigation systems?',
            answer: 'Yes, it is 100% water-soluble and does not clog emitters, filters, or micro-tubes.',
          },
          {
            question: 'Is this safe for organic certification?',
            answer: 'Yes, it is formulated in compliance with NPOP and certified organic standards.',
          },
          {
            question: 'Can it be mixed with other bio-pesticides?',
            answer: 'Yes, it is compatible with all organic formulations and neem extracts.',
          },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
          afterImage: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before',
          afterTag: 'After 30 Days',
          disclaimer: '*Results may vary depending on crop type, soil condition and farming practices.',
        },
      },
    },
    {
      title: 'Neem Oil 100% Cold-Pressed 1L',
      slug: 'neem-oil-cold-pressed-1l',
      description: 'Pure, organic cold-pressed Azadirachtin (10,000 PPM) bio-pesticide. Provides broad-spectrum control against aphids, whiteflies, thrips, caterpillars, mealybugs, and mites without harming beneficial pollinators.',
      price: 520.0,
      discountPrice: 460.0,
      stock: 35,
      rating: 4.9,
      numReviews: 48,
      featured: true,
      categoryId: bioPesticides.id,
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
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
    const created = await prisma.product.create({
      data: prod,
    });

    // Create a demo verified review for the product
    await prisma.review.create({
      data: {
        rating: 5,
        comment: `Excellent results on my farm with ${created.title}. Crop vigor and tillering improved significantly in just 10 days!`,
        userId: customer1.id,
        productId: created.id,
      },
    });

    await prisma.review.create({
      data: {
        rating: 4,
        comment: 'High quality genuine product. Delivered on time and helped enhance plant health.',
        userId: customer2.id,
        productId: created.id,
      },
    });
  }

  console.log(`🌾 Seeded ${products.length} authentic FarmerBench agricultural products with reviews and complete CMS attributes.`);
  
  // 5. Create Authentic Orders & Shipping Addresses for Seeded Farmers
  const allCreatedProducts = await prisma.product.findMany();

  for (let i = 0; i < seededFarmers.length; i++) {
    const farmer = seededFarmers[i];
    const addr = await prisma.shippingAddress.create({
      data: {
        userId: farmer.id,
        fullName: farmer.name,
        street: '12/4 East Main Farm Road',
        city: farmer.location ? farmer.location.split(',')[0].trim() : 'Thanjavur',
        state: 'Tamil Nadu',
        postalCode: '613001',
        country: 'India',
        phone: farmer.phone || '+91 98421 88321',
      },
    });

    // Create 2-4 orders for each farmer
    const orderCount = (i % 3) + 2;
    for (let o = 0; o < orderCount; o++) {
      const prod1 = allCreatedProducts[(i + o) % allCreatedProducts.length];
      const prod2 = allCreatedProducts[(i + o + 2) % allCreatedProducts.length];

      const item1Price = prod1.discountPrice || prod1.price;
      const item2Price = prod2.discountPrice || prod2.price;
      const totalAmount = item1Price * 2 + item2Price;

      await prisma.order.create({
        data: {
          userId: farmer.id,
          shippingAddressId: addr.id,
          paymentMethod: 'CASH_ON_DELIVERY',
          paymentStatus: 'PAID',
          orderStatus: o === 0 ? 'DELIVERED' : 'PROCESSING',
          itemsPrice: totalAmount,
          taxPrice: Math.round(totalAmount * 0.05),
          shippingPrice: 0,
          totalPrice: totalAmount + Math.round(totalAmount * 0.05),
          items: {
            create: [
              {
                productId: prod1.id,
                title: prod1.title,
                price: item1Price,
                quantity: 2,
                imageUrl: prod1.images && prod1.images[0] ? prod1.images[0] : null,
              },
              {
                productId: prod2.id,
                title: prod2.title,
                price: item2Price,
                quantity: 1,
                imageUrl: prod2.images && prod2.images[0] ? prod2.images[0] : null,
              },
            ],
          },
          payment: {
            create: {
              amount: totalAmount + Math.round(totalAmount * 0.05),
              method: 'CASH_ON_DELIVERY',
              status: 'PAID',
              transactionId: 'TXN-' + Date.now().toString().slice(-6) + '-' + i + o,
            },
          },
        },
      });
    }
  }

  console.log('?? Created authentic order histories and shipping addresses for all seeded farmers.');

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
