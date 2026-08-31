async function testRegisterOtp() {
  const payload = {
    name: 'Ponraj P',
    email: 'ponraj.test.verification@farmerbench.dev',
    phone: '+919342642527',
    location: 'Thanjavur',
    password: 'Ponraj@01',
  };

  console.log('Testing POST http://localhost:5000/api/auth/register-otp with payload:', payload);

  const res = await fetch('http://localhost:5000/api/auth/register-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log('Status Code:', res.status);
  console.log('Response Body:', JSON.stringify(data, null, 2));

  if (res.status === 200 && data.success) {
    console.log('✅ PASS: register-otp dispatched successfully!');
  } else {
    console.error('❌ FAIL: register-otp returned error');
    process.exit(1);
  }
}

testRegisterOtp();
