/**
 * Test script for /api/auth/check-email endpoint
 *
 * Usage:
 * node test-email-check.js [email_to_test]
 *
 * Example:
 * node test-email-check.js test@example.com
 */

const email = process.argv[2] || 'test@example.com';
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

console.log('Testing email check API...');
console.log('Email:', email);
console.log('URL:', `${baseUrl}/api/auth/check-email`);
console.log('---');

fetch(`${baseUrl}/api/auth/check-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email })
})
  .then(async (response) => {
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.exists) {
      console.log('✅ Email exists in database');
      if (data.user_id) {
        console.log('User ID:', data.user_id);
      }
    } else {
      console.log('❌ Email does not exist in database');
    }
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
  });
