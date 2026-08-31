const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
let seedCode = fs.readFileSync(seedPath, 'utf8');

const orderSeedingCode = `
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
                imageUrl: prod1.images?.[0] || null,
              },
              {
                productId: prod2.id,
                title: prod2.title,
                price: item2Price,
                quantity: 1,
                imageUrl: prod2.images?.[0] || null,
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
`;

const target = "console.log('? Database seed completed successfully.');";
if (seedCode.includes(target)) {
  seedCode = seedCode.replace(target, orderSeedingCode + '\n  ' + target);
  fs.writeFileSync(seedPath, seedCode, 'utf8');
  console.log('Successfully updated seed.ts with order histories');
} else {
  console.error('Could not find target string in seed.ts');
}
