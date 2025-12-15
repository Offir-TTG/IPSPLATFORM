/**
 * Test Date Parsing Fix
 *
 * This tests that dates from database (2026-04-15) display correctly
 * without timezone shifting.
 */

// Simulate database value (TIMESTAMPTZ from Postgres)
const dbValue = '2026-04-15T00:00:00+00:00';

console.log('=== Date Parsing Test ===\n');
console.log('Database value:', dbValue);
console.log('Current timezone offset:', new Date().getTimezoneOffset() / 60, 'hours');
console.log('');

// Extract date-only part (what our code does)
const dateOnly = dbValue.split('T')[0];
console.log('Extracted dateOnly:', dateOnly);
console.log('');

// ✅ CORRECT METHOD: Parse as local midnight
const localDate = new Date(dateOnly + 'T00:00:00');
console.log('✅ Local Time Approach:');
console.log('  new Date(dateOnly + "T00:00:00")');
console.log('  ISO:', localDate.toISOString());
console.log('  Display:', localDate.toLocaleDateString());
console.log('  Expected: 4/15/2026');
console.log('  Match:', localDate.toLocaleDateString() === '4/15/2026' ? '✅ YES' : '❌ NO');
console.log('');

// Test date manipulation
const nextMonth = new Date(localDate);
nextMonth.setMonth(nextMonth.getMonth() + 1);
console.log('✅ Add 1 month (setMonth):');
console.log('  Result:', nextMonth.toLocaleDateString());
console.log('  Expected: 5/15/2026');
console.log('  Match:', nextMonth.toLocaleDateString() === '5/15/2026' ? '✅ YES' : '❌ NO');
console.log('');

// ❌ OLD METHOD (for comparison): Parse as UTC
const utcDate = new Date(Date.UTC(2026, 3, 15, 0, 0, 0));
console.log('❌ Old UTC Approach (WRONG):');
console.log('  Date.UTC(2026, 3, 15, 0, 0, 0)');
console.log('  ISO:', utcDate.toISOString());
console.log('  Display:', utcDate.toLocaleDateString());
console.log('  Expected: 4/15/2026');
console.log('  Match:', utcDate.toLocaleDateString() === '4/15/2026' ? '✅ YES' : '❌ NO');
console.log('');

console.log('=== Summary ===');
console.log('Local time approach:', localDate.toLocaleDateString() === '4/15/2026' ? '✅ WORKS' : '❌ FAILS');
console.log('UTC approach:', utcDate.toLocaleDateString() === '4/15/2026' ? '✅ WORKS' : '❌ FAILS');
