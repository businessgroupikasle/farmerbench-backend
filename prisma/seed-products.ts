import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive agricultural products seed (10 Full Products)...');

  // 2. Fetch Category and Subcategory records for safe mapping
  const categories = await prisma.category.findMany({
    include: { subcategories: true },
  });

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  const subcategoryBySlug = new Map(
    categories.flatMap((c) => c.subcategories.map((s) => [s.slug, s]))
  );

  // 3. Define 10 Fully-Detailed Agricultural Products
  const productsData = [
    // --------------------------------------------------------------------------
    // Product 1: Bio-NPK Liquid Consortium
    // --------------------------------------------------------------------------
    {
      title: 'Bio-NPK Liquid Consortium (Certified Bio-Fertilizer)',
      slug: 'bio-npk-liquid-consortium',
      categorySlug: 'organic-farming',
      subcategorySlug: 'bio-fertilizers',
      price: 650,
      discountPrice: 499,
      stock: 85,
      featured: true,
      description:
        'Bio-NPK Liquid Consortium is a synergistic biological formulation comprising Nitrogen-fixing (Azotobacter), Phosphate-solubilizing (Bacillus megaterium), and Potassium-mobilizing (Frateuria aurantia) beneficial bacteria. Specially engineered to activate soil biology, enhance macro-nutrient availability, and reduce reliance on synthetic chemical fertilizers by 25-30%. Ideal for paddy, sugarcane, banana, cotton, vegetables, and fruit orchards.',
      images: [
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['500 ml', '1 L', '5 L'],
        variants: [
          { label: '500 ml', packSize: '500 ml', quantity: '500', unit: 'ml', price: 280, comparePrice: 350, stock: 40 },
          { label: '1 L', packSize: '1 L', quantity: '1', unit: 'L', price: 499, comparePrice: 650, stock: 35 },
          { label: '5 L Can', packSize: '5 L', quantity: '5', unit: 'L', price: 2199, comparePrice: 2800, stock: 10 },
        ],
        features: [
          'High microbial CFU count of > 1 x 10^8 cells/ml',
          'Tri-action: Fixes atmospheric Nitrogen, solubilizes locked Phosphorus & mobilizes Potassium',
          'Enhances beneficial rhizosphere microbial biodiversity',
          '100% Organic, residue-free, and safe for earthworms & pollinators',
          'Compatible with drip irrigation and fertigation systems',
        ],
        benefits: [
          'Reduces synthetic chemical fertilizer costs by 20% to 30%',
          'Improves root elongation, white root density, and water retention',
          'Restores healthy soil organic carbon and pH equilibrium',
          'Delivers 15-22% increase in harvest yield with superior produce quality',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Seed / Seedling Treatment', description: 'Mix 10 ml per kg seed or dip root balls in 100 ml per 10 L water for 20 minutes before planting.' },
          { stepNumber: 2, title: 'Drip / Soil Drenching', description: 'Apply 1 Liter per acre via drip irrigation during early vegetative and grand growth stages.' },
          { stepNumber: 3, title: 'Foliar Application', description: 'Dilute 3 to 5 ml per liter of water and spray thoroughly on leaf foliage early morning.' },
        ],
        dosageTable: [
          { crop: 'Paddy & Cereals', foliarSpray: '3 ml / L water', dripIrrigation: '1 L / Acre at tillering stage' },
          { crop: 'Vegetables (Tomato, Chilli)', foliarSpray: '2.5 ml / L water', dripIrrigation: '1 L / Acre every 20 days' },
          { crop: 'Sugarcane & Banana', foliarSpray: '4 ml / L water', dripIrrigation: '2 L / Acre in two split doses' },
        ],
        ingredients: 'Azotobacter chroococcum (1x10^8 CFU/ml), Bacillus megaterium (1x10^8 CFU/ml), Frateuria aurantia (1x10^8 CFU/ml), Organic Nutrient Broth base Q.S.',
        specifications: [
          { label: 'Formulation', value: 'Aqueous Liquid Consortium' },
          { label: 'CFU Count', value: 'Min. 1 x 10^8 CFU/ml' },
          { label: 'pH Range', value: '6.5 - 7.5' },
          { label: 'Certification', value: 'NPOP Organic Compliant' },
          { label: 'Shelf Life', value: '12 Months from MFD' },
        ],
        faqs: [
          { question: 'Can I mix Bio-NPK with chemical fertilizers?', answer: 'Bio-NPK can be used alongside fertilizers, but maintain an interval of 4-7 days after applying strong chemical fungicides or copper products to preserve bacterial viability.' },
          { question: 'Is it suitable for drip irrigation?', answer: 'Yes, it is 100% water-soluble and will not clog drip emitters or filters.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before Bio-NPK (Pale foliage & low root spread)',
          afterImage: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
          afterTag: 'After 3 Weeks (Deep green canopy & dense feeder roots)',
          disclaimer: 'Actual results depend on baseline soil organic matter and optimal irrigation scheduling.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 2: Trichoderma Viride 1.5% WP
    // --------------------------------------------------------------------------
    {
      title: 'Trichoderma Viride 1.5% WP (Eco Bio-Fungicide)',
      slug: 'trichoderma-viride-bio-fungicide',
      categorySlug: 'organic-farming',
      subcategorySlug: 'bio-fungicides',
      price: 320,
      discountPrice: 240,
      stock: 110,
      featured: true,
      description:
        'Trichoderma Viride 1.5% WP is an antagonistic bio-control fungal formulation proven against notorious soil-borne pathogens including Fusarium, Pythium, Rhizoctonia, and Phytophthora. It controls damping-off, collar rot, root rot, rhizome rot, and vascular wilt in vegetables, pulses, spices, and plantation crops while boosting plant natural systemic resistance.',
      images: [
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['500 g', '1 kg', '5 kg'],
        variants: [
          { label: '500 g', packSize: '500 g', quantity: '500', unit: 'g', price: 140, comparePrice: 180, stock: 50 },
          { label: '1 kg', packSize: '1 kg', quantity: '1', unit: 'kg', price: 240, comparePrice: 320, stock: 45 },
          { label: '5 kg Bucket', packSize: '5 kg', quantity: '5', unit: 'kg', price: 1050, comparePrice: 1400, stock: 15 },
        ],
        features: [
          'Pure strain Trichoderma viride with minimum 2 x 10^6 CFU/g count',
          'Broad spectrum biological control against soil and seed borne fungal diseases',
          'Secretes chitinase and beta-glucanase to lyse pathogen cell walls',
          'Safe for soil organisms, beneficial predators, and domestic livestock',
        ],
        benefits: [
          'Prevents seedling mortality and damping-off during nursery stages',
          'Stops rhizome rot in turmeric, ginger, and cardamom',
          'Induces Systemic Acquired Resistance (SAR) throughout the crop life',
          'Non-chemical, leaves zero residues on fruits and vegetables',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Seed Treatment', description: 'Mix 10 grams per kg of seeds with a small quantity of water before sowing.' },
          { stepNumber: 2, title: 'Soil Enrichment', description: 'Mix 1-2 kg of powder with 50 kg of well-rotted farmyard manure (FYM) or vermicompost; incubate for 7 days under shade before soil broadcast.' },
          { stepNumber: 3, title: 'Soil Drenching', description: 'Dissolve 5 to 8 grams per liter of water and drench the root basin during disease onset.' },
        ],
        dosageTable: [
          { crop: 'Vegetables (Chilli, Tomato, Brinjal)', foliarSpray: '5 g / L root drench', dripIrrigation: '1.5 kg / Acre in FYM' },
          { crop: 'Turmeric & Ginger', foliarSpray: '8 g / L drenching', dripIrrigation: '2.5 kg / Acre soil application' },
          { crop: 'Pulses & Oilseeds', foliarSpray: '10 g / kg seed dressing', dripIrrigation: '1 kg / Acre basal dose' },
        ],
        ingredients: 'Trichoderma viride active spores (2 x 10^6 CFU/g min), Sterilized Talc mineral carrier 98.5%',
        specifications: [
          { label: 'Physical State', value: 'Fine Wettable Powder (WP)' },
          { label: 'Color', value: 'Off-white to Pale Greenish' },
          { label: 'Carrier', value: 'High purity Talc base' },
          { label: 'Shelf Life', value: '12 Months in cool dry storage' },
        ],
        faqs: [
          { question: 'Can Trichoderma be combined with bio-fertilizers?', answer: 'Yes! Mixing Trichoderma with Pseudomonas fluorescens or Bio-NPK in FYM multiplies beneficial effects.' },
          { question: 'Is it effective against damping-off in seedling trays?', answer: 'Extremely effective. Drenching seedling pro-trays eliminates damping-off completely.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before Treatment (Wilt & collar fungal lesions)',
          afterImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
          afterTag: 'After 14 Days (Healthy white root zone, zero wilt)',
          disclaimer: 'For optimal colonisation, keep soil moist after application.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 3: Cold-Pressed Pure Neem Oil 10,000 PPM
    // --------------------------------------------------------------------------
    {
      title: 'Cold-Pressed Pure Neem Oil 10,000 PPM (Bio-Pesticide)',
      slug: 'cold-pressed-neem-oil-10000-ppm',
      categorySlug: 'organic-farming',
      subcategorySlug: 'bio-pesticides',
      price: 750,
      discountPrice: 580,
      stock: 65,
      featured: true,
      description:
        'Certified organic cold-pressed Neem Oil formulated with standardized 10,000 PPM Azadirachtin EC. Functions as an anti-feedant, repellent, insect growth regulator (IGR), and oviposition deterrent against more than 200 species of chewing and sucking insect pests including whiteflies, thrips, aphids, spider mites, mealybugs, and leaf miners. Gentle on honeybees, ladybirds, and spiders.',
      images: [
        'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['250 ml', '500 ml', '1 L', '5 L'],
        variants: [
          { label: '250 ml', packSize: '250 ml', quantity: '250', unit: 'ml', price: 190, comparePrice: 250, stock: 20 },
          { label: '500 ml', packSize: '500 ml', quantity: '500', unit: 'ml', price: 330, comparePrice: 420, stock: 25 },
          { label: '1 L', packSize: '1 L', quantity: '1', unit: 'L', price: 580, comparePrice: 750, stock: 15 },
          { label: '5 L Can', packSize: '5 L', quantity: '5', unit: 'L', price: 2550, comparePrice: 3200, stock: 5 },
        ],
        features: [
          'High concentration 10,000 PPM Azadirachtin EC formula',
          'Dual action: insect repellent and egg hatch inhibitor',
          'Prevents insects from developing pesticide resistance',
          'Pre-emulsified with organic emulsifier for effortless water dispersion',
          'Zero synthetic chemical residue, harvestable 24 hours after spray',
        ],
        benefits: [
          'Controls aggressive thrips, aphids, whiteflies, and mealybugs naturally',
          'Prevents viral transmission carried by sucking insect vectors',
          'Reduces secondary fungal spore germination on leaf surfaces',
          'Export quality compliant with international MRL residue norms',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Dilution', description: 'Mix 3 ml to 5 ml of Neem Oil per 1 liter of water. Shake container thoroughly.' },
          { stepNumber: 2, title: 'Spray Coverage', description: 'Spray thoroughly on both upper and undersides of leaves where pests shelter.' },
          { stepNumber: 3, title: 'Timing', description: 'Spray in late afternoon to prevent photodegradation of Azadirachtin from midday sunlight.' },
        ],
        dosageTable: [
          { crop: 'Vegetables (Tomato, Brinjal, Capsicum)', foliarSpray: '3-4 ml / L water', dripIrrigation: 'Not recommended for drip' },
          { crop: 'Cotton & Pulses', foliarSpray: '4-5 ml / L water', dripIrrigation: 'Foliar spray only' },
          { crop: 'Fruit Orchards (Pomegranate, Citrus)', foliarSpray: '5 ml / L water', dripIrrigation: 'Foliar spray only' },
        ],
        ingredients: 'Cold Pressed Neem Seed Oil (Azadirachtin 10,000 PPM), Natural Bio-Emulsifiers 10%',
        specifications: [
          { label: 'Active Ingredient', value: 'Azadirachtin 1.0% w/w (10,000 PPM)' },
          { label: 'Formulation', value: 'Emulsifiable Concentrate (EC)' },
          { label: 'Specific Gravity', value: '0.91 - 0.93 g/ml' },
          { label: 'Compatibility', value: 'Compatible with bio-fertilizers & wetting agents' },
        ],
        faqs: [
          { question: 'Do I need to add soap powder or detergent?', answer: 'No, this product already comes pre-emulsified. It mixes instantly into water creating a milky emulsion.' },
          { question: 'Will it harm beneficial honeybees?', answer: 'Neem oil does not harm foraging adult bees when sprayed in the evening when bees are not active.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before Spray (Heavy whitefly infestation under leaf)',
          afterImage: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800&auto=format&fit=crop&q=80',
          afterTag: 'After 48 Hours (Pest clear, zero leaf scorch)',
          disclaimer: 'Repeat spray every 10 days for persistent sucking pest pressure.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 4: Seaweed Ascophyllum Nodosum Extract Bio-Stimulant
    // --------------------------------------------------------------------------
    {
      title: 'Seaweed Ascophyllum Nodosum Bio-Stimulant (Root & Flower Booster)',
      slug: 'seaweed-ascophyllum-nodosum-extract',
      categorySlug: 'organic-farming',
      subcategorySlug: 'bio-stimulants',
      price: 890,
      discountPrice: 699,
      stock: 90,
      featured: false,
      description:
        'Pure cold-processed marine algae extract harvested from Ascophyllum Nodosum. Packed with natural plant hormones (auxins, cytokinins, gibberellins), betaines, mannitol, and over 60 chelated trace minerals. Triggers rapid root initiation, stimulates vigorous lateral branching, improves flower retention, and boosts crop tolerance to heat, drought, and transplanting shock.',
      images: [
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534710961216-75c88202f43e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['500 ml', '1 L', '5 L'],
        variants: [
          { label: '500 ml', packSize: '500 ml', quantity: '500', unit: 'ml', price: 380, comparePrice: 490, stock: 45 },
          { label: '1 L', packSize: '1 L', quantity: '1', unit: 'L', price: 699, comparePrice: 890, stock: 35 },
          { label: '5 L Can', packSize: '5 L', quantity: '5', unit: 'L', price: 3100, comparePrice: 3900, stock: 10 },
        ],
        features: [
          'Derived from 100% North Atlantic Ascophyllum Nodosum cold extraction',
          'Rich in natural alginic acid, betaines, cytokinins and trace micronutrients',
          'Boosts chlorophyll synthesis and photosynthesis efficiency',
          'Arrests premature flower and fruit drop in heavy bearing crops',
        ],
        benefits: [
          'Significantly improves fruit size, shine, uniform color, and shelf life',
          'Provides proven abiotic stress tolerance against heat waves and drought',
          'Enhances nutrient uptake efficiency of primary NPK fertilizers',
          'Improves harvest grades for export-oriented farmers',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Vegetative Growth Phase', description: 'Apply 2 ml per liter water at 20-25 days after transplanting to accelerate branching.' },
          { stepNumber: 2, title: 'Flowering Stage', description: 'Spray 2.5 ml per liter water at pre-flowering stage to maximize bud formation.' },
          { stepNumber: 3, title: 'Fruit Setting', description: 'Repeat 15 days later to enhance fruit weight and uniform sizing.' },
        ],
        dosageTable: [
          { crop: 'Vegetables & Flowers', foliarSpray: '2 - 2.5 ml / L water', dripIrrigation: '1 L / Acre' },
          { crop: 'Fruit Crops (Banana, Mango, Grapes)', foliarSpray: '3 ml / L water', dripIrrigation: '1.5 L / Acre' },
          { crop: 'Field Crops (Paddy, Cotton, Maize)', foliarSpray: '2.5 ml / L water', dripIrrigation: '1 L / Acre' },
        ],
        ingredients: 'Ascophyllum Nodosum Marine Algae Extract (28% solids w/v), Organic Alginates 6%, Plant Auxins & Cytokinins',
        specifications: [
          { label: 'Color & Appearance', value: 'Dark Brownish-Black Viscous Liquid' },
          { label: 'pH', value: '8.0 - 9.0' },
          { label: 'Solubility', value: '100% Water Soluble' },
          { label: 'Organic Certification', value: 'OMRI Listed & ECOCERT compliant' },
        ],
        faqs: [
          { question: 'When is the best time to apply seaweed extract?', answer: 'Early morning or evening during pre-flowering and fruit development stages.' },
          { question: 'Can this be given through drip irrigation?', answer: 'Yes, it works wonderfully via drip and feeds the root rhizosphere directly.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before (Heat-stressed foliage & flower dropping)',
          afterImage: 'https://images.unsplash.com/photo-1534710961216-75c88202f43e?w=800&auto=format&fit=crop&q=80',
          afterTag: 'After 15 Days (Dense flowering & fruit set)',
          disclaimer: 'Pair with balanced irrigation for optimum yield outcome.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 5: Grand Naine (G9) Tissue Culture Banana Seedlings
    // --------------------------------------------------------------------------
    {
      title: 'Grand Naine (G9) Premium Tissue Culture Banana Seedlings',
      slug: 'grand-naine-g9-tissue-culture-banana',
      categorySlug: 'Seedlings',
      subcategorySlug: 'tissue-culture-banana',
      price: 400,
      discountPrice: 320,
      stock: 250,
      featured: true,
      description:
        'Certified primary hardened Grand Naine (G9) Cavendish tissue culture banana plantlets. Propagated from elite virus-indexed mother rhizomes in ISO-certified lab facilities. These plants exhibit uniform field vigor, early bunch initiation (9-10 months), heavy bunches weighing 30-38 kg with 10-12 hands, and cylindrical bright yellow fingers favored in commercial wholesale markets.',
      images: [
        'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['10 Plants Tray', '25 Plants Bundle', '50 Plants Bundle', '100 Plants Pack'],
        variants: [
          { label: '10 Plants Tray', packSize: '10 Plants Tray', quantity: '10', unit: 'Plants', price: 180, comparePrice: 220, stock: 50 },
          { label: '25 Plants Bundle', packSize: '25 Plants Bundle', quantity: '25', unit: 'Plants', price: 320, comparePrice: 400, stock: 80 },
          { label: '50 Plants Bundle', packSize: '50 Plants Bundle', quantity: '50', unit: 'Plants', price: 620, comparePrice: 780, stock: 70 },
          { label: '100 Plants Pack', packSize: '100 Plants Pack', quantity: '100', unit: 'Plants', price: 1200, comparePrice: 1550, stock: 50 },
        ],
        features: [
          'Virus-indexed free from BBTV (Banana Bunchy Top) and CMV pathogens',
          'Genetically uniform true-to-type G9 Cavendish variety',
          'Hardened for 60 days with established fibrous root balls in coco-peat plugs',
          'Matures synchronously allowing a single synchronized harvesting window',
        ],
        benefits: [
          'Average bunch weight of 30 to 38 kg with high market recovery',
          'Short crop cycle of 11 to 12 months from planting to harvest',
          'Dwarf to medium height reduces lodging risks during strong winds',
          'Premium export quality fingers with attractive golden ripening',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Pit Preparation', description: 'Dig pits of 60x60x60 cm. Fill with 10 kg FYM, 250 g neem cake, and 50 g single superphosphate.' },
          { stepNumber: 2, title: 'Transplanting', description: 'Gently remove the seedling from polybag without disturbing the root ball and plant upright at soil collar level.' },
          { stepNumber: 3, title: 'Irrigation & Care', description: 'Provide immediate light irrigation. Maintain soil moisture with drip lines and apply mulch around basin.' },
        ],
        dosageTable: [
          { crop: 'Planting Spacing', foliarSpray: 'Pit size 60x60x60 cm', dripIrrigation: '6 ft x 6 ft (1,210 plants/acre)' },
          { crop: 'Fertigation 3rd Month', foliarSpray: 'Foliar micro-nutrient spray', dripIrrigation: 'NPK 19:19:19 weekly' },
          { crop: 'Bunch Development', foliarSpray: 'SOP spray on hands', dripIrrigation: 'Potassium Nitrate via drip' },
        ],
        ingredients: 'Primary hardened G9 tissue culture plantlet with vigorous coco-peat rhizosphere',
        specifications: [
          { label: 'Variety', value: 'Grand Naine (G9 - Cavendish Group)' },
          { label: 'Plant Height on Delivery', value: '20 - 25 cm (4-5 healthy leaves)' },
          { label: 'Expected Bunch Weight', value: '30 - 38 kg average' },
          { label: 'Harvesting Duration', value: '11 - 12 Months' },
        ],
        faqs: [
          { question: 'How are the seedlings shipped safely?', answer: 'Seedlings are packed in ventilated protective carton crates with root moisture preservation to ensure zero transit damage.' },
          { question: 'What is the recommended plant population per acre?', answer: 'Standard spacing of 6 ft x 6 ft accommodates approximately 1,200 plants per acre.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'At Delivery (22 cm hardened nursery plantlet)',
          afterImage: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80',
          afterTag: 'At 11 Months (35 kg heavy commercial bunch)',
          disclaimer: 'Bunch weight is subject to nutrient fertigation and desuckering management.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 6: Taiwan Red Lady 786 Hybrid Papaya Seedlings
    // --------------------------------------------------------------------------
    {
      title: 'Taiwan Red Lady 786 Hybrid Papaya Seedlings',
      slug: 'taiwan-red-lady-786-papaya-seedlings',
      categorySlug: 'Seedlings',
      subcategorySlug: 'papaya',
      price: 350,
      discountPrice: 280,
      stock: 140,
      featured: false,
      description:
        'Authentic Known-You Taiwan Red Lady 786 F1 hybrid papaya seedlings raised in sterile seedling pro-trays. Semi-dwarf, early fruiting, and high-yielding variety known for sweet, deep red aromatic flesh with 13-14% Brix sugar content. Yields begin at just 80 cm trunk height within 8-9 months. High tolerance to Papaya Ring Spot Virus (PRSV).',
      images: [
        'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['10 Seedlings Tray', '25 Seedlings Pack', '50 Seedlings Commercial'],
        variants: [
          { label: '10 Seedlings Tray', packSize: '10 Seedlings Tray', quantity: '10', unit: 'Plants', price: 150, comparePrice: 190, stock: 50 },
          { label: '25 Seedlings Pack', packSize: '25 Seedlings Pack', quantity: '25', unit: 'Plants', price: 280, comparePrice: 350, stock: 60 },
          { label: '50 Seedlings Commercial', packSize: '50 Seedlings Commercial', quantity: '50', unit: 'Plants', price: 540, comparePrice: 680, stock: 30 },
        ],
        features: [
          'Original Known-You Taiwan 786 genetically authenticated hybrid',
          'Gynodioecious (hermaphrodite & female) ensuring 100% productive trees',
          'Semi-dwarf plant habit starts bearing fruit at 60-80 cm height',
          'Tolerant to Papaya Ring Spot Virus (PRSV) and anthracnose',
        ],
        benefits: [
          'Heavy yielding capacity of 60 to 80 kg fruit per tree annually',
          'Thick skin and firm flesh provide superior shipping and shelf life',
          'Extremely sweet flesh with 13° - 14° Brix rating',
          'High commercial returns within the first year of planting',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Land Preparation', description: 'Prepare raised beds or mounds with good drainage. Dig pits of 45x45x45 cm spaced 7x7 feet.' },
          { stepNumber: 2, title: 'Planting', description: 'Transplant 35-45 day old seedling carefully in the evening and tamp soil firmly around base.' },
          { stepNumber: 3, title: 'Drainage Management', description: 'Ensure zero waterlogging at root zone as papaya is sensitive to standing water.' },
        ],
        dosageTable: [
          { crop: 'Field Spacing', foliarSpray: 'Raised bed recommended', dripIrrigation: '7 ft x 7 ft (900 plants/acre)' },
          { crop: 'Basal Pit Mix', foliarSpray: 'Neem cake 200g / pit', dripIrrigation: 'FYM 10 kg + Bone meal 100g' },
          { crop: 'Monthly Fertigation', foliarSpray: 'Foliar Boron & Zinc spray', dripIrrigation: '13:0:45 + Calcium Nitrate' },
        ],
        ingredients: 'Vigorous 40-day hardened pro-tray papaya seedling in coco-peat plugs',
        specifications: [
          { label: 'Variety', value: 'Red Lady 786 F1 Hybrid' },
          { label: 'Flesh Color', value: 'Deep Reddish-Orange' },
          { label: 'Average Fruit Weight', value: '1.5 - 2.0 kg' },
          { label: 'First Harvest', value: '8 - 9 Months after planting' },
        ],
        faqs: [
          { question: 'Will all plants bear fruits?', answer: 'Yes! Red Lady 786 is gynodioecious, meaning both female and hermaphrodite plants bear delicious fruits.' },
          { question: 'How can I prevent waterlogging?', answer: 'Plant seedlings on raised beds (1.5 ft high) with drip lines running along the bed top.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'At Transplant (Healthy sturdy pro-tray seedling)',
          afterImage: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800&auto=format&fit=crop&q=80',
          afterTag: 'At 9 Months (Heavily laden tree with 30+ fruits)',
          disclaimer: 'Yield depends on disease prevention and weed-free basin management.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 7: Smart Solar Agricultural Insect Light Trap
    // --------------------------------------------------------------------------
    {
      title: 'Smart Solar Agricultural Insect Light Trap (Eco Pest Trapper)',
      slug: 'smart-solar-agricultural-light-trap',
      categorySlug: 'traps',
      subcategorySlug: 'light-traps',
      price: 3499,
      discountPrice: 2799,
      stock: 40,
      featured: true,
      description:
        'Autonomous solar-powered agricultural insect trap engineered for eco-friendly pest management across paddy, cotton, vegetables, and orchard plantations. Uses a patented multi-spectrum UV-LED (365nm - 395nm) to attract destructive nocturnal adult insects (stem borers, bollworms, fruit borer moths, leaf folders) before they mate and lay thousands of eggs in the field. Fully automatic dusk-to-dawn operation with a built-in solar charging panel.',
      images: [
        'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['1 Trap Unit', 'Set of 2 Units', 'Farm Pack of 4 Units'],
        variants: [
          { label: '1 Trap Unit', packSize: '1 Trap Unit', quantity: '1', unit: 'Unit', price: 2799, comparePrice: 3499, stock: 25 },
          { label: 'Set of 2 Units', packSize: 'Set of 2 Units', quantity: '2', unit: 'Units', price: 5199, comparePrice: 6500, stock: 10 },
          { label: 'Farm Pack of 4 Units', packSize: 'Farm Pack of 4 Units', quantity: '4', unit: 'Units', price: 9800, comparePrice: 12500, stock: 5 },
        ],
        features: [
          'High-efficiency monocrystalline solar panel with auto daylight sensor',
          'Multi-band UV-LED calibrated precisely to pest attraction spectrum',
          'Automatic smart timer: activates at sunset and runs for 4.5 peak pest activity hours',
          'Removable heavy-duty funnel & lockable collection chamber for easy clearing',
          '100% weatherproof IP65 water-resistant design for all seasons',
        ],
        benefits: [
          'Catches up to 500-1,200 egg-laying adult moths per night',
          'Massively cuts down reliance on toxic chemical insecticide sprays by 40-50%',
          'Zero recurring electricity cost, zero wiring required in remote fields',
          'Covers a wide effective radius of 1.5 to 2.0 acres per unit',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Assembly', description: 'Mount the unit on a 6-foot wooden or bamboo pole in the center of the field.' },
          { stepNumber: 2, title: 'Height Adjustment', description: 'Keep the UV light source 1 to 1.5 feet above the crop canopy level.' },
          { stepNumber: 3, title: 'Collection Chamber', description: 'Add a small amount of soapy water or water with few drops of kerosene to the bottom pan; clean catch weekly.' },
        ],
        dosageTable: [
          { crop: 'Paddy / Rice Fields', foliarSpray: 'Not applicable', dripIrrigation: '1 trap per 1.5 to 2.0 acres' },
          { crop: 'Cotton & Pulses', foliarSpray: 'Not applicable', dripIrrigation: '1 trap per 1.5 acres' },
          { crop: 'Vegetable Farms', foliarSpray: 'Not applicable', dripIrrigation: '1 trap per 1.0 acre' },
        ],
        ingredients: 'High impact UV-stabilized ABS engineering plastic body, Solar Monocrystalline Panel, 3.7V Li-ion Battery',
        specifications: [
          { label: 'Solar Panel', value: '5W 6V High Efficiency Panel' },
          { label: 'Battery', value: '3.7V 4400 mAh Lithium-Ion' },
          { label: 'Light Source', value: 'Dual Spectrum 365nm UV LED' },
          { label: 'Daily Runtime', value: '4.5 Hours automated nightly cycle' },
          { label: 'Protection Rating', value: 'IP65 Weatherproof' },
        ],
        faqs: [
          { question: 'Why does it run for only 4-5 hours per night?', answer: 'Agricultural research proves 90% of destructive moths fly during the first 4 hours after dusk. Running 4.5 hours conserves battery and spares day-active beneficial predators.' },
          { question: 'Does it work during monsoon cloudy days?', answer: 'Yes, the 4400 mAh battery stores enough power to operate for up to 3 consecutive rainy/cloudy days.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before Trap (Severe stem borer damage & dead hearts)',
          afterImage: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=800&auto=format&fit=crop&q=80',
          afterTag: 'After Trap (Hundreds of moths trapped nightly, clean crop)',
          disclaimer: 'Empty pest tray weekly to prevent odor and maintain light reflection.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 8: Yellow & Blue Sticky Pest Monitoring Traps
    // --------------------------------------------------------------------------
    {
      title: 'Yellow & Blue Sticky Pest Traps (Pack of 25)',
      slug: 'yellow-blue-sticky-pest-traps-pack',
      categorySlug: 'traps',
      subcategorySlug: 'sticky-traps',
      price: 550,
      discountPrice: 420,
      stock: 180,
      featured: false,
      description:
        'Premium double-sided weatherproof insect adhesive sheets designed for monitoring and mass trapping of flying horticultural pests. Yellow sheets attract whiteflies, aphids, leaf miners, and gnats; Blue sheets attract thrips and fruit flies. Coated with non-drying, UV-resistant polybutene glue that remains sticky through heavy rains, high heat, and winds for 60-90 days.',
      images: [
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['Pack of 25 Traps', 'Pack of 50 Traps', 'Pack of 100 Traps'],
        variants: [
          { label: 'Pack of 25 Traps (15Y + 10B)', packSize: 'Pack of 25 Traps', quantity: '25', unit: 'Sheets', price: 420, comparePrice: 550, stock: 90 },
          { label: 'Pack of 50 Traps (30Y + 20B)', packSize: 'Pack of 50 Traps', quantity: '50', unit: 'Sheets', price: 780, comparePrice: 990, stock: 60 },
          { label: 'Pack of 100 Traps (60Y + 40B)', packSize: 'Pack of 100 Traps', quantity: '100', unit: 'Sheets', price: 1450, comparePrice: 1850, stock: 30 },
        ],
        features: [
          'Dual spectrum pack: 15 Yellow + 10 Blue double-sided sheets',
          'UV-stabilized thick virgin plastic sheet that does not curl under sunlight',
          'High tack non-drip adhesive unaffected by rain or temperatures up to 50°C',
          'Comes with pre-punched hanging holes and sturdy wire twist ties',
        ],
        benefits: [
          'Effective physical control without spraying harmful chemicals on edible veggies',
          'Provides early warning of incoming pest infestations for IPM programs',
          'Safe for use in polyhouses, shade nets, and open field horticulture',
          'Lasts up to 3 months or until the sheet surface is completely full of pests',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Placement', description: 'Hang traps on wooden stakes or trellis wires 6 to 12 inches above the plant canopy.' },
          { stepNumber: 2, title: 'Trap Density', description: 'Use 8-10 traps per acre for pest monitoring, or 20-25 traps per acre for mass suppression.' },
          { stepNumber: 3, title: 'Maintenance', description: 'Replace once the sticky surface is over 75% covered with insects or dust.' },
        ],
        dosageTable: [
          { crop: 'Vegetables & Greenhouses', foliarSpray: 'Not applicable', dripIrrigation: '20 to 25 traps per acre' },
          { crop: 'Chilli & Capsicum (Thrips focus)', foliarSpray: 'Not applicable', dripIrrigation: 'Blue traps priority (15 blue/acre)' },
          { crop: 'Cotton & Papaya', foliarSpray: 'Not applicable', dripIrrigation: '15 yellow + 10 blue per acre' },
        ],
        ingredients: 'Virgin Polypropylene sheet 200 microns, Non-toxic optical adhesive with UV inhibitors',
        specifications: [
          { label: 'Sheet Dimensions', value: '15 cm x 20 cm (Double sided)' },
          { label: 'Adhesive Type', value: 'Non-drying Polybutene Resin' },
          { label: 'Field Longevity', value: '60 - 90 Days under tropical sun' },
          { label: 'Toxicity', value: '100% Non-Toxic & Residue-Free' },
        ],
        faqs: [
          { question: 'Why are there both yellow and blue sheets?', answer: 'Yellow attracts whiteflies, aphids, and leaf miners, while blue is scientifically proven to attract thrips and fruit flies.' },
          { question: 'Does rain wash the glue away?', answer: 'No, the glue is completely water-repellent and retains its stickiness even after tropical downpours.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Before (Swarming whiteflies and thrips on chilli leaf)',
          afterImage: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
          afterTag: 'After 1 Week (Traps covered with thousands of pests)',
          disclaimer: 'Position traps slightly above canopy for best visual attraction.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 9: Shivam F1 High-Yield Hybrid Tomato Seeds
    // --------------------------------------------------------------------------
    {
      title: 'Shivam F1 High-Yield Hybrid Tomato Seeds',
      slug: 'shivam-f1-hybrid-tomato-seeds',
      categorySlug: 'seeds',
      subcategorySlug: 'horticulture-crops',
      price: 620,
      discountPrice: 480,
      stock: 95,
      featured: false,
      description:
        'Shivam F1 is an indeterminate hybrid tomato seed variety celebrated for heavy yield potential (35-45 tonnes/acre) and remarkable disease tolerance against Tomato Yellow Leaf Curl Virus (TYLCV), Bacterial Wilt, and Early Blight. Produces glossy, firm, deep-red square-round fruits with thick pericarp walls, ensuring excellent transport durability up to 14 days.',
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['10 g', '25 g', '50 g Pack'],
        variants: [
          { label: '10 g (approx. 3,000 seeds)', packSize: '10 g', quantity: '10', unit: 'g', price: 480, comparePrice: 620, stock: 45 },
          { label: '25 g Pack', packSize: '25 g', quantity: '25', unit: 'g', price: 1120, comparePrice: 1450, stock: 35 },
          { label: '50 g Commercial Pack', packSize: '50 g', quantity: '50', unit: 'g', price: 2100, comparePrice: 2750, stock: 15 },
        ],
        features: [
          'High genetic purity (> 98%) with minimum 85% verified germination rate',
          'Dual resistance: Tomato Yellow Leaf Curl Virus (TYLCV) & Bacterial Wilt',
          'Firm, square-round fruits weighing 90 to 110 grams with deep crimson red internal flesh',
          'Thick pericarp walls prevent cracking during monsoon harvests and long distance hauling',
        ],
        benefits: [
          'Exceptional yield capacity of 35 to 45 tons per acre under good fertigation',
          'Prolonged harvesting period of 90-120 days with continuous fruit flushes',
          'Superior shelf life of 12-14 days commands top premium at wholesale mandis',
          'Strong vegetative canopy shields developing tomatoes from sun scald',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Nursery Sowing', description: 'Sow in pro-trays with sterilized coco-peat and Trichoderma. Seeds germinate in 5-6 days.' },
          { stepNumber: 2, title: 'Transplanting', description: 'Transplant 25-28 day old seedlings at 3.5 ft bed-to-bed and 1.5 ft plant-to-plant spacing.' },
          { stepNumber: 3, title: 'Staking', description: 'Trellis with bamboo poles and twine at 30 days to support heavy fruit bunches.' },
        ],
        dosageTable: [
          { crop: 'Seed Rate', foliarSpray: '40-50 g seeds per acre', dripIrrigation: 'Pro-tray sowing recommended' },
          { crop: 'Transplanting Spacing', foliarSpray: 'Staking required', dripIrrigation: '3.5 ft x 1.5 ft (7,500 plants/acre)' },
          { crop: 'First Picking', foliarSpray: 'Weekly SOP spray', dripIrrigation: '65 - 70 days after planting' },
        ],
        ingredients: 'Certified Hybrid F1 Tomato Seed (Treated with Thiram 2g/kg for seedling protection)',
        specifications: [
          { label: 'Germination Rate', value: '85% Minimum' },
          { label: 'Physical Purity', value: '98% Minimum' },
          { label: 'Fruit Weight', value: '90 - 110 g' },
          { label: 'Maturity Days', value: '65 - 70 Days to first pick' },
        ],
        faqs: [
          { question: 'How many seeds are in a 10-gram pouch?', answer: 'Approximately 2,800 to 3,200 seeds, sufficient for nearly half an acre.' },
          { question: 'Is this variety suitable for summer cultivation?', answer: 'Yes, Shivam F1 has outstanding heat set and tolerates summer temperatures up to 40°C.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Certified Seed Pouch (Germination test 92%)',
          afterImage: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
          afterTag: 'Field Result (Firm, shiny red cluster harvest)',
          disclaimer: 'Staking and balanced potassium nutrition maximize fruit weight.',
        },
      },
    },

    // --------------------------------------------------------------------------
    // Product 10: Heavy-Duty 16L Battery Operated Knapsack Sprayer
    // --------------------------------------------------------------------------
    {
      title: 'Heavy-Duty 16L Battery Operated Knapsack Sprayer (12V 12Ah)',
      slug: 'heavy-duty-16l-battery-knapsack-sprayer',
      categorySlug: 'farm-equipment',
      subcategorySlug: null,
      price: 3200,
      discountPrice: 2499,
      stock: 35,
      featured: true,
      description:
        'Professional agricultural knapsack sprayer equipped with a high-torque 12V DC diaphragm motor and extended-run 12V 12Ah maintenance-free battery. Delivers continuous operating pressure up to 100 PSI (0.45 Mpa) without tiring manual pumping. Sprays 25-30 full tanks (approx. 400-500 Liters) on a single overnight charge. Features an ergonomic contoured lumbar backrest and adjustable brass/poly nozzles.',
      images: [
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        packSizes: ['Standard 16L Sprayer', 'Sprayer + Dual Battery Kit'],
        variants: [
          { label: 'Standard 16L Sprayer + 12V Battery', packSize: 'Standard 16L Sprayer', quantity: '1', unit: 'Unit', price: 2499, comparePrice: 3200, stock: 25 },
          { label: 'Sprayer + Spare Battery & 4 Brass Nozzles Kit', packSize: 'Sprayer + Dual Battery Kit', quantity: '1', unit: 'Kit', price: 3199, comparePrice: 4100, stock: 10 },
        ],
        features: [
          'High pressure 12V 4.0 LPM auto cut-off micro-diaphragm pump',
          'Heavy duty 12V 12Ah Lead-Acid SMF battery providing 6-8 hours spray time',
          '16 Litre high density UV-stabilized polyethylene (HDPE) impact-resistant tank',
          'Includes 4 multi-purpose nozzles: Hollow cone, Fan jet, Dual head, and 4-hole cluster',
          'Telescopic stainless steel spray lance extendable up to 3.5 feet',
        ],
        benefits: [
          'Eliminates exhausting manual pumping, speeding up field spray tasks by 3X',
          'Consistent atomized droplet size ensures uniform chemical/bio coverage',
          'Ergonomic padded shoulder harness minimizes shoulder and spinal strain',
          'Cost effective maintenance with readily available replacement spare parts',
        ],
        usageSteps: [
          { stepNumber: 1, title: 'Charging', description: 'Charge battery using provided smart charger for 5-6 hours until indicator LED turns green.' },
          { stepNumber: 2, title: 'Chemical Mixing', description: 'Always pour spray solution through the top basket filter to prevent nozzle clogging.' },
          { stepNumber: 3, title: 'Pressure Adjustment', description: 'Use the variable regulator knob on side to fine tune mist for delicate crops or long jet for tall trees.' },
        ],
        dosageTable: [
          { crop: 'Battery Capacity', foliarSpray: '12V 12Ah Sealed Lead Acid', dripIrrigation: '6-8 hours continuous operation' },
          { crop: 'Spray Volume per Charge', foliarSpray: '25 to 30 full tanks (400-500 L)', dripIrrigation: 'Covers 4-5 acres on one charge' },
          { crop: 'Pump Working Pressure', foliarSpray: '0.2 - 0.45 MPa (up to 100 PSI)', dripIrrigation: 'Auto pressure cut-off switch' },
        ],
        ingredients: 'Virgin HDPE Tank, 12V 12Ah SMF Battery, Copper Winding Diaphragm Motor, Stainless Steel Telescopic Lance',
        specifications: [
          { label: 'Tank Capacity', value: '16 Litres' },
          { label: 'Battery Specification', value: '12 Volt 12 Ampere-Hour (Ah)' },
          { label: 'Pump Flow Rate', value: '4.0 Litres / Minute' },
          { label: 'Charger', value: '1.7A Smart Auto-Cut Charger included' },
          { label: 'Warranty', value: '6 Months Manufacturer Warranty on Motor & Battery' },
        ],
        faqs: [
          { question: 'How many tanks can I spray on a single full charge?', answer: 'You can easily spray 25 to 30 tanks (approx. 400 to 500 liters of spray solution).' },
          { question: 'Are replacement batteries and nozzles easily available?', answer: 'Yes, standard 12V 12Ah batteries and universal nozzles fit this sprayer perfectly.' },
        ],
        beforeAfter: {
          beforeImage: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=80',
          beforeTag: 'Manual Pumping (Exhausting, uneven droplet spray)',
          afterImage: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800&auto=format&fit=crop&q=80',
          afterTag: 'Battery Knapsack (Effortless ultra-fine uniform mist)',
          disclaimer: 'Rinse tank with clean water after spraying pesticides or bio-fertilizers.',
        },
      },
    },
  ];

  // 4. Upsert each product with all detailed attributes and reviews
  console.log(`\n📦 Upserting ${productsData.length} agricultural products...`);
  for (const item of productsData) {
    const category = categoryBySlug.get(item.categorySlug);
    if (!category) {
      console.warn(`⚠️ Category '${item.categorySlug}' not found. Skipping '${item.title}'.`);
      continue;
    }

    let subcategoryId: string | null = null;
    if (item.subcategorySlug) {
      const subcategory = subcategoryBySlug.get(item.subcategorySlug);
      if (subcategory) {
        subcategoryId = subcategory.id;
      } else {
        console.warn(`⚠️ Subcategory '${item.subcategorySlug}' not found for '${item.title}'.`);
      }
    }

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        price: item.price,
        discountPrice: item.discountPrice,
        stock: item.stock,
        featured: item.featured,
        images: item.images,
        attributes: item.attributes,
        categoryId: category.id,
        subcategoryId,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price,
        discountPrice: item.discountPrice,
        stock: item.stock,
        featured: item.featured,
        images: item.images,
        attributes: item.attributes,
        categoryId: category.id,
        subcategoryId,
      },
    });

    console.log(`  📦 [${product.slug}] -> Price: ₹${product.discountPrice || product.price} | Stock: ${product.stock}`);
  }

  const totalProducts = await prisma.product.count();
  console.log(`\n🎉 Successfully completed product seeding! Total products in DB: ${totalProducts}.`);
}

main()
  .catch((error) => {
    console.error('❌ Product seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
