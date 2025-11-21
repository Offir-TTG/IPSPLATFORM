/**
 * Script to test if we can authenticate with session cookies
 */

async function testSessionAuth() {
  console.log('Testing session authentication...\n');

  try {
    // Try to get current user info (requires auth)
    const response = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      credentials: 'include', // Important: include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(result, null, 2));

    if (response.status === 200) {
      console.log('\n✅ Session authentication working!');
    } else {
      console.log('\n❌ Session authentication failed');
      console.log('This script cannot test authenticated endpoints without browser cookies');
      console.log('The user needs to test deletion from the actual UI in the browser');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testSessionAuth();
