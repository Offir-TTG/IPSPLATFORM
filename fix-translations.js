// Quick script to fix audit translations context
// Run with: node fix-translations.js

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/fix-translations',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 200) {
      console.log('\n✅ Translations fixed! Refresh your browser.');
    } else {
      console.log('\n❌ Error fixing translations. You may need to run the SQL script manually.');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.log('\n⚠️  Make sure your dev server is running on localhost:3000');
});

req.end();
