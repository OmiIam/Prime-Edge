/**
 * Test script to verify the transfer API endpoints work correctly
 * Run with: node test-transfer-api.js
 */

const apiBase = 'http://localhost:5173';

async function testApiEndpoint(endpoint, method = 'GET', headers = {}, body = null) {
  console.log(`\n🧪 Testing ${method} ${endpoint}`);
  
  try {
    const response = await fetch(`${apiBase}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null
    });

    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${contentType}`);

    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        console.log('✅ JSON Response:', JSON.stringify(data, null, 2));
        return { success: true, data, status: response.status };
      } catch (parseError) {
        console.log('❌ JSON Parse Error:', parseError.message);
        return { success: false, error: 'JSON parse failed', status: response.status };
      }
    } else {
      const text = await response.text();
      console.log('❌ Non-JSON Response:', text.slice(0, 200));
      return { success: false, error: 'Non-JSON response', status: response.status };
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Transfer API Endpoints\n');
  
  // Test health endpoint first
  console.log('=== Health Check ===');
  await testApiEndpoint('/api/health');

  // Test the new transfer updates endpoint (should return 401 without auth)
  console.log('\n=== Transfer Updates (Unauthenticated) ===');
  await testApiEndpoint('/api/user/transfer/updates');

  // Test transfer endpoint (should return 401 without auth)
  console.log('\n=== Transfer Submit (Unauthenticated) ===');
  await testApiEndpoint('/api/user/transfer', 'POST', {}, {
    amount: 100,
    recipientInfo: '1234567890',
    transferType: 'external_bank',
    bankName: 'Chase Bank'
  });

  // Test admin transfers endpoint (should return 401 without auth)
  console.log('\n=== Admin Pending Transfers (Unauthenticated) ===');
  await testApiEndpoint('/api/admin/pending-transfers');

  console.log('\n✅ All endpoint tests completed!');
  console.log('\nNotes:');
  console.log('- 401 responses are expected for authenticated endpoints');
  console.log('- All responses should have Content-Type: application/json');
  console.log('- No 405 (Method Not Allowed) errors should occur');
  console.log('- Check server logs for detailed request processing');
}

// Run if called directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

export { runTests, testApiEndpoint };