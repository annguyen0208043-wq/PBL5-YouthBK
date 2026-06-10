async function test() {
  try {
    // 1. Login
    console.log('Logging in as lienchi@dut.udn.vn...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lienchi@dut.udn.vn', password: 'LienChi@123' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', await loginRes.text());
      return;
    }
    
    const { token, user } = await loginRes.json() as any;
    console.log('Login success! User role:', user.role);
    console.log('Token:', token);

    // 2. Fetch /api/notifications/sent
    console.log('Fetching /api/notifications/sent...');
    const sentRes = await fetch('http://localhost:5000/api/notifications/sent', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status /sent:', sentRes.status);
    console.log('Response /sent:', await sentRes.text());

    // 3. Fetch /api/notifications/faculties
    console.log('Fetching /api/notifications/faculties...');
    const facRes = await fetch('http://localhost:5000/api/notifications/faculties', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status /faculties:', facRes.status);
    console.log('Response /faculties:', await facRes.text());
  } catch (e) {
    console.error('Error in test:', e);
  }
}

test();
