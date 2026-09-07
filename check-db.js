const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  try {
    console.log('📊 Checking Database Status...\n');
    
    // Try to count contacts
    const count = await prisma.contact.count();
    console.log('✅ Contact table exists in database');
    console.log(`📈 Current contacts in DB: ${count}\n`);
    
    // List existing contacts
    if (count > 0) {
      const contacts = await prisma.contact.findMany();
      console.log('📝 Existing contacts:');
      contacts.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.name} (${c.email}) - Read: ${c.isRead}`);
      });
    }
    
    console.log('\n✅ Database connection working!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    process.exit(1);
  }
}

checkDB();
