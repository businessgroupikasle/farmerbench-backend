import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

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

  // 2. Create Default Users (Development / Demo Credentials)
  const defaultPassword = await bcrypt.hash('DemoPass123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@formerbench.dev',
      name: 'Arun(Super Admin)',
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

  const customer1 = await prisma.user.create({
    data: {
      email: 'customer@formerbench.dev',
      name: 'Ramanathan K.',
      password: defaultPassword,
      role: Role.CUSTOMER,
      phone: '+91 98421 88321',
      emailVerified: true,
      location: 'Thanjavur, Tamil Nadu',
      crops: 'Paddy / 15 Acres',
      status: 'Active',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'meena.devi@farmmail.in',
      name: 'Meena Devi',
      password: defaultPassword,
      role: Role.CUSTOMER,
      phone: '+91 97892 44102',
      emailVerified: true,
      location: 'Erode, Tamil Nadu',
      crops: 'Tomato & Vegetables / 6 Acres',
      status: 'Active',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: 'suresh.babu@cottonagri.com',
      name: 'Suresh Babu',
      password: defaultPassword,
      role: Role.CUSTOMER,
      phone: '+91 94432 11980',
      emailVerified: true,
      location: 'Madurai, Tamil Nadu',
      crops: 'Cotton & Pulses / 12 Acres',
      status: 'Active',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('👤 Created demo users (Admin & Farmers).');

  // 3. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Audio & Acoustics',
        slug: 'audio-acoustics',
        description: 'Studio-grade headphones, earbuds, and spatial sound systems',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Smart Wearables',
        slug: 'smart-wearables',
        description: 'Next-generation fitness trackers, luxury smartwatches, and biometric rings',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Modern Computing',
        slug: 'modern-computing',
        description: 'Minimalist mechanical keyboards, ergonomic mice, and 4K displays',
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Apparel & Streetwear',
        slug: 'apparel-streetwear',
        description: 'Premium organic cotton hoodies, technical outerwear, and modern essentials',
        imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Architectural lamps, ceramic pour-over kits, and smart home essentials',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
      },
    }),
  ]);

  const [audioCat, wearablesCat, computingCat, apparelCat, homeCat] = categories;
  console.log('🏷️ Created product categories.');

  // 4. Create Products
  const products = [
    {
      title: 'AeroPulse Pro Wireless Noise-Cancelling Headphones',
      slug: 'aeropulse-pro-wireless-headphones',
      description: 'Crafted with aerospace-grade anodized aluminum and ultra-plush memory foam, the AeroPulse Pro delivers breathtaking Hi-Res audio with adaptive active noise cancellation and 42-hour battery life.',
      price: 349.99,
      discountPrice: 299.99,
      stock: 45,
      rating: 4.9,
      numReviews: 28,
      featured: true,
      categoryId: audioCat.id,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        battery: '42 hours',
        connectivity: 'Bluetooth 5.3 / USB-C Lossless',
        anc: 'Hybrid Adaptive 48dB',
        color: 'Midnight Titanium',
      },
    },
    {
      title: 'Vanguard Chrono S3 Titanium Smartwatch',
      slug: 'vanguard-chrono-s3-smartwatch',
      description: 'Precision sapphire crystal meets Grade 5 titanium chassis. Features 14-day battery life, continuous ECG & SpO2 monitoring, dual-band GPS, and 100M water resistance.',
      price: 499.0,
      discountPrice: null,
      stock: 18,
      rating: 4.8,
      numReviews: 19,
      featured: true,
      categoryId: wearablesCat.id,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        material: 'Grade 5 Titanium & Sapphire',
        waterResistance: '10 ATM (100m)',
        battery: 'Up to 14 days',
      },
    },
    {
      title: 'Keyforge Studio Mechanical Custom Keyboard 75%',
      slug: 'keyforge-studio-mechanical-keyboard',
      description: 'Gasket-mounted CNC aluminum keyboard with hot-swappable tactile lubricated switches, sound-dampening poron foam, and wireless tri-mode connectivity.',
      price: 219.0,
      discountPrice: 189.0,
      stock: 32,
      rating: 4.9,
      numReviews: 42,
      featured: true,
      categoryId: computingCat.id,
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        layout: '75% Compact',
        switches: 'Gateron Oil King Pre-lubed',
        keycaps: 'Double-shot PBT Cherry Profile',
      },
    },
    {
      title: 'Komorebi Heavyweight Japanese Terry Hoodie',
      slug: 'komorebi-heavyweight-terry-hoodie',
      description: '500 GSM loopback organic Japanese cotton fleece. Garment-dyed in small batches with vintage washed tone, oversized dropped shoulders, and double-layered structured hood.',
      price: 135.0,
      discountPrice: 110.0,
      stock: 60,
      rating: 4.7,
      numReviews: 15,
      featured: true,
      categoryId: apparelCat.id,
      images: [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        weight: '500 GSM French Terry',
        fit: 'Relaxed Oversized',
        color: 'Faded Charcoal',
      },
    },
    {
      title: 'Lumina Arc Minimalist Bauhaus Desk Lamp',
      slug: 'lumina-arc-minimalist-desk-lamp',
      description: 'Sculptural brass and sandblasted glass table lamp featuring touch-sensitive stepless dimming, 98 CRI eye-care diffused LED array, and built-in 15W wireless MagSafe charging pad.',
      price: 185.0,
      discountPrice: null,
      stock: 24,
      rating: 4.8,
      numReviews: 12,
      featured: false,
      categoryId: homeCat.id,
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        colorTemperature: '2700K - 5000K Adjustable',
        charging: '15W Qi Fast Wireless Base',
        material: 'Brushed Brass & Frosted Opal Glass',
      },
    },
    {
      title: 'AcousticEdge Horizon Spatial Soundbar & Subwoofer',
      slug: 'acousticedge-horizon-soundbar',
      description: 'Dolby Atmos 5.1.2 cinema soundbar with wireless high-excursion subwoofer, room acoustic calibration, and eARC lossless HDMI pass-through.',
      price: 699.0,
      discountPrice: 599.0,
      stock: 12,
      rating: 5.0,
      numReviews: 8,
      featured: true,
      categoryId: audioCat.id,
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        power: '450W Peak',
        channels: '5.1.2 Dolby Atmos',
        connectivity: 'HDMI eARC / Wi-Fi AirPlay 2 / Optical',
      },
    },
    {
      title: 'ErgoMaster Precision Wireless Ergonomic Mouse',
      slug: 'ergomaster-precision-wireless-mouse',
      description: 'Designed in collaboration with hand specialists. 57-degree natural vertical angle reduces forearm strain by 80%. Equipped with 8K DPI Darkfield optical sensor and magnetic scroll wheel.',
      price: 99.0,
      discountPrice: 85.0,
      stock: 4, // Low stock demo!
      rating: 4.6,
      numReviews: 24,
      featured: false,
      categoryId: computingCat.id,
      images: [
        'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        dpi: '8,000 DPI Darkfield',
        battery: '70 days on full charge',
        grip: '57-degree Natural Handshake',
      },
    },
    {
      title: 'Artisan Ceramic Pour-Over Coffee Dripper Set',
      slug: 'artisan-ceramic-pourover-set',
      description: 'Handcrafted stoneware cone with spiral internal ribs for optimal extraction rate. Includes heat-resistant borosilicate glass carafe and walnut base stand.',
      price: 78.0,
      discountPrice: null,
      stock: 3, // Low stock demo!
      rating: 4.9,
      numReviews: 31,
      featured: false,
      categoryId: homeCat.id,
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      ],
      attributes: {
        capacity: '600ml (2-4 cups)',
        material: 'Kyoto Ceramic & American Walnut',
      },
    },
  ];

  const createdProducts = [];
  for (const prodData of products) {
    const product = await prisma.product.create({
      data: prodData,
    });
    createdProducts.push(product);
  }

  console.log(`📦 Seeded ${createdProducts.length} premium products.`);

  // 5. Seed Reviews
  await prisma.review.create({
    data: {
      productId: createdProducts[0].id,
      userId: customer1.id,
      rating: 5,
      comment: 'Unbelievable soundstage and the ANC easily blocks out subway commute chatter. The ear cushions feel like clouds.',
    },
  });

  await prisma.review.create({
    data: {
      productId: createdProducts[0].id,
      userId: customer2.id,
      rating: 5,
      comment: 'Build quality is second to none. The aluminum finish is gorgeous and battery life lasts all week.',
    },
  });

  await prisma.review.create({
    data: {
      productId: createdProducts[2].id,
      userId: customer1.id,
      rating: 5,
      comment: 'The switch lubing is factory perfect and typing on this gasket mount is pure ASMR bliss.',
    },
  });

  console.log('⭐ Seeded product reviews.');

  // 6. Seed Sample Completed Order for Customer1
  const address = await prisma.shippingAddress.create({
    data: {
      userId: customer1.id,
      fullName: 'Sarah Jenkins',
      street: '742 Evergreen Terrace',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94107',
      country: 'United States',
      phone: '+1 (555) 234-5678',
    },
  });

  const order1 = await prisma.order.create({
    data: {
      userId: customer1.id,
      shippingAddressId: address.id,
      paymentMethod: 'CREDIT_CARD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      itemsPrice: 299.99,
      taxPrice: 24.0,
      shippingPrice: 0.0,
      totalPrice: 323.99,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            title: createdProducts[0].title,
            price: 299.99,
            quantity: 1,
            imageUrl: createdProducts[0].images[0],
          },
        ],
      },
      payment: {
        create: {
          amount: 323.99,
          method: 'CREDIT_CARD',
          status: 'PAID',
          transactionId: `TXN-DEMO-982187`,
        },
      },
    },
  });

  console.log(`🧾 Seeded sample order ${order1.id}.`);

  console.log('✅ Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Development Demo Credentials:');
  console.log('   Admin:    admin@formerbench.dev    / DemoPass123!');
  console.log('   Customer: customer@formerbench.dev / DemoPass123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
