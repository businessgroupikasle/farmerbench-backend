import { prisma } from '../src/config/database';
import { hashPassword, comparePassword } from '../src/utils/password';
import crypto from 'crypto';
import { env } from '../src/config/env';

const BASE_URL = 'http://localhost:5000/api';

const hashOtp = (otp: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${otp}:${env.JWT_SECRET}`)
    .digest('hex');
};

async function runTests() {
  console.log('🚀 Starting Comprehensive FarmerBench Password Reset & OTP Flow Tests...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, detail?: any) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  };

  // Setup test user in database
  const testEmail = 'test_reset_farmer@farmerbench.dev';
  const initialPassword = 'InitialPassword123!';
  const initialPasswordHash = await hashPassword(initialPassword);

  let testUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (testUser) {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { password: initialPasswordHash, status: 'Active', emailVerified: true },
    });
  } else {
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Test Reset Farmer',
        password: initialPasswordHash,
        role: 'CUSTOMER',
        emailVerified: true,
        status: 'Active',
      },
    });
  }

  // Clean up any old OTPs and reset tokens for test user
  await prisma.otp.deleteMany({ where: { identifier: testEmail } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: testUser.id } });

  console.log('--- TEST 1: Non-Existing User Account Enumeration Privacy ---');
  const nonExistentEmail = 'nonexistent_farmer_12345@unknown.org';
  const resNonExistent = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: nonExistentEmail }),
  });
  const dataNonExistent = await resNonExistent.json();

  assert(resNonExistent.status === 200, 'Non-existent email returns 200 OK');
  assert(dataNonExistent.success === true, 'Non-existent email returns success: true');
  assert(
    dataNonExistent.message === 'If an account exists for this email, a verification code has been sent.',
    'Non-existent email returns generic message without revealing account absence'
  );
  assert(!('accountExists' in dataNonExistent), 'Zero accountExists leakage in API response');

  const otpCountNonExistent = await prisma.otp.count({ where: { identifier: nonExistentEmail } });
  assert(otpCountNonExistent === 0, 'No OTP record was created for non-existent email');

  console.log('\n--- TEST 2: Existing User Forgot Password Request ---');
  const resForgot = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const dataForgot = await resForgot.json();

  assert(resForgot.status === 200, 'Existing email returns 200 OK');
  assert(dataForgot.success === true, 'Existing email returns success: true');
  assert(
    dataForgot.message === 'If an account exists for this email, a verification code has been sent.',
    'Existing email returns generic message matching non-existent email'
  );

  const activeOtp = await prisma.otp.findFirst({
    where: { identifier: testEmail, purpose: 'PASSWORD_RESET', consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  assert(!!activeOtp, 'OTP record created in database with purpose PASSWORD_RESET');
  assert(activeOtp?.attempts === 0, 'Initial OTP attempt count is 0');
  assert(
    activeOtp!.expiresAt.getTime() > Date.now(),
    'OTP expires in the future (~5 minutes)'
  );

  console.log('\n--- TEST 3: Resend Cooldown Enforcement ---');
  const resCooldown = await fetch(`${BASE_URL}/auth/resend-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  });
  const dataCooldown = await resCooldown.json();

  assert(resCooldown.status === 429, 'Immediate resend rejected with 429 Too Many Requests');
  assert(
    dataCooldown.message?.includes('seconds before requesting a new password reset code'),
    'Cooldown error message provides remaining seconds'
  );

  console.log('\n--- TEST 4: Wrong OTP Attempt & Max Attempts Invalidation ---');
  // Attempt 1: Wrong OTP
  const resWrong1 = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: '000000' }),
  });
  const dataWrong1 = await resWrong1.json();
  assert(resWrong1.status === 400, 'Wrong OTP rejected with 400 Bad Request');
  assert(dataWrong1.message?.includes('4 attempt(s) remaining'), 'Attempts remaining counter decrements to 4');

  // Attempt 2, 3, 4
  for (let i = 2; i <= 4; i++) {
    await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '111111' }),
    });
  }

  // Attempt 5: Reaches max attempts
  const resWrong5 = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: '222222' }),
  });
  const dataWrong5 = await resWrong5.json();
  assert(
    dataWrong5.code === 'OTP_MAX_ATTEMPTS' || dataWrong5.message?.includes('Too many incorrect attempts'),
    '5th incorrect attempt invalidates OTP with OTP_MAX_ATTEMPTS'
  );

  const otpAfterMax = await prisma.otp.findUnique({ where: { id: activeOtp!.id } });
  assert(otpAfterMax?.consumedAt !== null, 'OTP is marked consumed after max failed attempts');

  console.log('\n--- TEST 5: Valid OTP Verification & Reset Token Issuance ---');
  // Generate a known fresh OTP for testing
  await prisma.otp.deleteMany({ where: { identifier: testEmail } });
  const testKnownOtp = '654321';
  const testOtpHash = hashOtp(testKnownOtp);
  await prisma.otp.create({
    data: {
      identifier: testEmail,
      otpHash: testOtpHash,
      purpose: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      metadata: { userId: testUser.id },
    },
  });

  const resVerify = await fetch(`${BASE_URL}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, otp: testKnownOtp }),
  });
  const dataVerify = await resVerify.json();

  assert(resVerify.status === 200, 'Valid OTP verification returns 200 OK');
  assert(dataVerify.success === true, 'Verification returns success: true');
  assert(typeof dataVerify.data?.resetToken === 'string', 'Received raw plaintext resetToken');
  assert(dataVerify.data?.resetToken.length === 64, 'resetToken is 64-hex char secure random token');

  const rawResetToken = dataVerify.data?.resetToken;

  // Verify PasswordResetToken record in database
  const tokenHash = crypto.createHash('sha256').update(`${rawResetToken}:${env.JWT_SECRET}`).digest('hex');
  const tokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  assert(!!tokenRecord, 'PasswordResetToken record found in database by tokenHash');
  assert(tokenRecord?.userId === testUser.id, 'PasswordResetToken linked to correct user');
  assert(tokenRecord?.usedAt === null, 'PasswordResetToken is unused');

  console.log('\n--- TEST 6: Complete Password Reset with Reset Token ---');
  const newPassword = 'UpdatedSecureFarmerPass2026!';
  const resReset = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken: rawResetToken,
      newPassword: newPassword,
      confirmPassword: newPassword,
    }),
  });
  const dataReset = await resReset.json();

  assert(resReset.status === 200, 'Password reset returns 200 OK');
  assert(dataReset.success === true, 'Password reset returns success: true');
  assert(
    dataReset.message === 'Password reset successfully. Please login with your new password.',
    'Success message guides user to login'
  );

  // Check database password update
  const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
  const isMatch = await comparePassword(newPassword, updatedUser!.password);
  assert(isMatch === true, 'User password in PostgreSQL updated with bcrypt hash of new password');

  const usedTokenRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  assert(usedTokenRecord?.usedAt !== null, 'PasswordResetToken marked used in database');

  console.log('\n--- TEST 7: Single-Use Reset Token Replay Prevention ---');
  const resReplay = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken: rawResetToken,
      newPassword: 'AnotherPassword999!',
    }),
  });
  const dataReplay = await resReplay.json();

  assert(resReplay.status === 400, 'Re-using reset token rejected with 400 Bad Request');
  assert(
    dataReplay.message?.includes('already used') || dataReplay.code === 'RESET_TOKEN_INVALID',
    'Replay attempt rejected due to single-use enforcement'
  );

  console.log('\n--- TEST 8: Verify Login Behavior with Old vs New Password ---');
  // Old password must fail
  const resOldLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: initialPassword }),
  });
  assert(resOldLogin.status === 401 || resOldLogin.status === 400, 'Login with OLD password fails');

  // New password must succeed
  const resNewLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPassword }),
  });
  const dataNewLogin = await resNewLogin.json();
  assert(resNewLogin.status === 200, 'Login with NEW password succeeds (200 OK)');
  assert(!!dataNewLogin.data?.token, 'JWT token returned on login with new password');

  // Cleanup test user
  await prisma.passwordResetToken.deleteMany({ where: { userId: testUser.id } });
  await prisma.otp.deleteMany({ where: { identifier: testEmail } });
  await prisma.user.delete({ where: { id: testUser.id } });

  console.log(`\n======================================================`);
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
