async function testAPI() {
  const response = await fetch('http://localhost:3000/api/admin/payments/schedules?page=1&limit=20', {
    headers: {
      'Cookie': 'your-session-cookie-here' // You'll need to get this from browser
    }
  });

  const data = await response.json();

  console.log('Total schedules in response:', data.schedules?.length || 0);
  console.log('Total count:', data.total);

  // Check for duplicate IDs
  const ids = data.schedules?.map((s: any) => s.id) || [];
  const uniqueIds = new Set(ids);

  console.log('\nUnique IDs:', uniqueIds.size);
  console.log('Total IDs:', ids.length);

  if (uniqueIds.size !== ids.length) {
    console.log('\n⚠️  DUPLICATES FOUND!');

    // Find which IDs are duplicated
    const idCounts: Record<string, number> = {};
    ids.forEach((id: string) => {
      idCounts[id] = (idCounts[id] || 0) + 1;
    });

    console.log('\nDuplicate IDs:');
    Object.entries(idCounts)
      .filter(([_, count]) => count > 1)
      .forEach(([id, count]) => {
        console.log(`  ${id}: appears ${count} times`);
      });
  } else {
    console.log('\n✅ No duplicate IDs found');
  }

  // Show first 5 schedules
  console.log('\nFirst 5 schedules:');
  data.schedules?.slice(0, 5).forEach((s: any, i: number) => {
    console.log(`${i + 1}. ID: ${s.id.substring(0, 8)}... User: ${s.user_name}, Payment #${s.payment_number}`);
  });
}

// Note: This won't work without proper authentication
// Instead, check the browser network tab for the actual API response
console.log('Check your browser Network tab for /api/admin/payments/schedules');
console.log('Look at the response and count how many items are in the "schedules" array');
console.log('Also check if any "id" values appear more than once');
