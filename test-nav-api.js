// Simple test to check if navigation API works
// Run this with: node test-nav-api.js

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/navigation');
    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
