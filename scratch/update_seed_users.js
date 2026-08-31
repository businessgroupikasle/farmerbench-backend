const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
let seedCode = fs.readFileSync(seedPath, 'utf8');

// Replace the user creation section with the full 8 farmers + orders
const userCreationCode = `  // 2. Create Default Users (Super Admin + Authentic Farmers)
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

  console.log(\`?? Created \${seededFarmers.length + 1} users in PostgreSQL (Super Admin + Farmers).\`);`;

// Replace the user creation block in seed.ts
const startUserIdx = seedCode.indexOf('  // 2. Create Default Users');
const endUserIdx = seedCode.indexOf('  // 3. Create Authentic FarmerBench Categories');

if (startUserIdx !== -1 && endUserIdx !== -1) {
  seedCode = seedCode.slice(0, startUserIdx) + userCreationCode + '\n\n' + seedCode.slice(endUserIdx);
  fs.writeFileSync(seedPath, seedCode, 'utf8');
  console.log('Successfully updated seed.ts with rich customer list');
} else {
  console.error('Could not find user creation block in seed.ts');
}
