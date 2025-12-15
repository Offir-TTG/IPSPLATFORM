const formatDate = (dateString: string) => {
  console.log('Input:', dateString);
  if (!dateString) {
    console.log('No date string');
    return 'Not set';
  }
  const date = new Date(dateString);
  console.log('Date object:', date);
  console.log('Is valid:', !isNaN(date.getTime()));
  if (isNaN(date.getTime())) return 'Not set';
  const formatted = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  console.log('Formatted:', formatted);
  return formatted;
};

// Test with actual date from database
const testDate = '2026-03-25T00:00:00+00:00';
console.log('\nTest Date:', testDate);
console.log('Result:', formatDate(testDate));
