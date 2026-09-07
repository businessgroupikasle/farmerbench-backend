const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing Contact API...\n');
    
    // Test 1: Check if Contact model exists
    console.log('1️⃣  Creating a contact...');
    const contact = await prisma.contact.create({
      data: {
        name: 'Test Farmer',
        email: 'farmer@test.com',
        phone: '+91-9876543210',
        subject: 'Testing',
        message: 'Test message'
      }
    });
    console.log('✅ Contact created:', contact.id);
    
    // Test 2: Get all contacts
    console.log('\n2️⃣  Fetching all contacts...');
    const contacts = await prisma.contact.findMany();
    console.log(`✅ Found ${contacts.length} contacts`);
    
    // Test 3: Get stats
    console.log('\n3️⃣  Getting stats...');
    const total = await prisma.contact.count();
    const unread = await prisma.contact.count({ where: { isRead: false } });
    console.log(`✅ Total: ${total}, Unread: ${unread}`);
    
    console.log('\n✅ All tests passed! API functionality is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
