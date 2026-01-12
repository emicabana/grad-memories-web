const BASE_URL = 'http://localhost:3000';

async function makeRequest(method, path, body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    console.error(`Fetch error for ${path}:`, err.message);
    throw err;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('[TEST 1] Registering admin user...');
  console.log('='.repeat(60));
  
  let result = await makeRequest('POST', '/api/auth/register', {
    email: 'admin@gradmemories.com',
    password: 'admin123',
    role: 'admin'
  });
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.data, null, 2));
  
  const adminId = result.data.id;
  if (!adminId) {
    console.log('ERROR: No admin ID returned');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('[TEST 2] Login admin...');
  console.log('='.repeat(60));
  
  result = await makeRequest('POST', '/api/auth/login', {
    email: 'admin@gradmemories.com',
    password: 'admin123'
  });
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.data, null, 2));
  
  const token = result.data.token;
  if (!token) {
    console.log('ERROR: No token returned');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('[TEST 3] Check admin panel (list assets)...');
  console.log('='.repeat(60));
  
  result = await makeRequest('GET', '/api/admin/assets', null, token);
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.data, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('[TEST 4] Health check...');
  console.log('='.repeat(60));
  
  result = await makeRequest('GET', '/api/health', null, null);
  console.log(`Status: ${result.status}`);
  console.log(JSON.stringify(result.data, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed successfully!');
  console.log('='.repeat(60) + '\n');
}

runTests().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
