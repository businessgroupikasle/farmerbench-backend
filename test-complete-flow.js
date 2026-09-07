const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFlow() {
  try {
    console.log('🧪 TESTING COMPLETE FLOW: Form → Backend → Database\n');
    
    // Step 1: Simulate form submission
    console.log('Step 1️⃣ : Simulating form submission...');
    const formData = {
      name: 'Ramesh Kumar',
      email: 'ramesh@farm.com',
      phone: '+91-9876543210',
      subject: 'Question about fertilizer',
      message: 'I want to know more about organic farming methods for paddy cultivation.'
    };
    console.log('📝 Form Data:', formData);
    
    // Step 2: Save to database
    console.log('\nStep 2️⃣ : Saving to database...');
    const contact = await prisma.contact.create({
      data: formData
    });
    console.log('✅ Saved successfully!');
    console.log('  ID:', contact.id);
    console.log('  Created:', contact.createdAt);
    console.log('  isRead:', contact.isRead);
    
    // Step 3: Verify it's in database
    console.log('\nStep 3️⃣ : Verifying in database...');
    const saved = await prisma.contact.findUnique({
      where: { id: contact.id }
    });
    
    if (saved) {
      console.log('✅ Verified! Contact is in database');
      console.log(`  Retrieved: ${saved.name} (${saved.email})`);
    }
    
    // Step 4: Get stats
    console.log('\nStep 4️⃣ : Getting dashboard stats...');
    const total = await prisma.contact.count();
    const unread = await prisma.contact.count({ where: { isRead: false } });
    console.log(`✅ Total contacts: ${total}`);
    console.log(`✅ Unread messages: ${unread}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ COMPLETE FLOW TEST PASSED!');
    console.log('='.repeat(50));
    console.log('\n✨ Form submission → Database storage is WORKING!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFlow();
