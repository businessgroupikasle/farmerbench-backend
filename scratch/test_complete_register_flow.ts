import { prisma } from '../src/config/database';

async function testCompleteFlow() {
  const email = 'ponraj.test.flow@farmerbench.dev';
  
  // Clean up
  await prisma.otp.deleteMany({ where: { identifier: email } });
  await prisma.user.deleteMany({ where: { email } });

  // 1. Send OTP
  console.log('1. Requesting registration OTP...');
  const res1 = await fetch('http://localhost:5000/api/auth/register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ponraj P',
      email,
      phone: '+919342642527',
      location: 'Thanjavur',
      password: 'Ponraj@01',
    }),
  });
  const data1 = await res1.json();
  console.log('Send OTP Response:', data1);

  // 2. Fetch OTP from DB to simulate user entering code
  const activeOtp = await prisma.otp.findFirst({
    where: { identifier: email, purpose: 'REGISTRATION', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Active OTP record found in DB:', !!activeOtp);

  // 3. Verify OTP and complete registration
  // Let's create an OTP with known code '123456' for deterministic verification test
  import('crypto').then(async (crypto) => {
    const { env } = await import('../src/config/env');
    const knownOtp = '123456';
    const hash = crypto.default
      .createHash('sha256')
      .update(`${knownOtp}:${env.JWT_SECRET}`)
      .digest('hex');

    await prisma.otp.update({
      where: { id: activeOtp!.id },
      data: { otpHash: hash },
    });

    console.log('2. Verifying OTP...');
    const res2 = await fetch('http://localhost:5000/api/auth/verify-register-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp: knownOtp,
        name: 'Ponraj P',
        phone: '+919342642527',
        location: 'Thanjavur',
        password: 'Ponraj@01',
      }),
    });
    const data2 = await res2.json();
    console.log('Verification Response:', data2);

    if (res2.status === 201 && data2.success && data2.data?.token) {
      console.log('✅ PASS: Complete registration with OTP verification succeeded!');
    } else {
      console.error('❌ FAIL: OTP verification failed');
      process.exit(1);
    }

    // Cleanup
    await prisma.otp.deleteMany({ where: { identifier: email } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });
}

testCompleteFlow();
