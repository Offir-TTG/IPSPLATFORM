require('dotenv').config({ path: '.env.local' });

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/tenant/users?limit=5', {
      headers: {
        'Cookie': 'sb-access-token=' + process.env.TEST_ACCESS_TOKEN
      }
    });
    
    const data = await response.json();
    console.log('API Response structure:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
