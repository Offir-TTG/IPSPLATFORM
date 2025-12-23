const crypto = require('crypto');

// Test Zoom signature generation
function generateSignature(sdkKey, sdkSecret, meetingNumber, role) {
  const timestamp = new Date().getTime() - 30000;
  const msg = Buffer.from(sdkKey + meetingNumber + timestamp + role).toString('base64');
  const hash = crypto
    .createHmac('sha256', sdkSecret)
    .update(msg)
    .digest('base64');
  const signature = Buffer.from(`${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

  console.log('='.repeat(80));
  console.log('ZOOM SIGNATURE GENERATION TEST');
  console.log('='.repeat(80));
  console.log('\nInputs:');
  console.log('  SDK Key:', sdkKey);
  console.log('  Meeting Number:', meetingNumber);
  console.log('  Role:', role);
  console.log('  Timestamp:', timestamp);
  console.log('\nIntermediate values:');
  console.log('  Message (before base64):', sdkKey + meetingNumber + timestamp + role);
  console.log('  Message (base64):', msg);
  console.log('  HMAC Hash:', hash);
  console.log('\nFinal signature components:');
  console.log('  Format: sdkKey.meetingNumber.timestamp.role.hash');
  console.log('  Value:', `${sdkKey}.${meetingNumber}.${timestamp}.${role}.${hash}`);
  console.log('\nFinal signature (base64):');
  console.log('  ', signature);
  console.log('  Length:', signature.length);
  console.log('\n' + '='.repeat(80));

  return signature;
}

// Test with sample values
const testSdkKey = 'hpydt1dNS9abcdefgh';
const testSdkSecret = 'Wtk7wY6G8aabcdefgh';
const testMeetingNumber = '89231935133';
const testRole = 0;

generateSignature(testSdkKey, testSdkSecret, testMeetingNumber, testRole);

console.log('\nNOTE: This is the signature generation algorithm being used.');
console.log('If Zoom rejects this, the issue is most likely:');
console.log('  1. Domain not whitelisted (ERROR 3712)');
console.log('  2. SDK credentials are invalid');
console.log('  3. Meeting SDK type mismatch (Server-to-Server vs Meeting SDK)');
