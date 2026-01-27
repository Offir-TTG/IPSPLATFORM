/**
 * Test Stats API Endpoint
 */
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'http://localhost:3000');

console.log('Testing API endpoint...\n');
console.log('If this doesn't work, it means the dev server isn't running.\n');

// Note: This would require authentication
console.log('To test manually:');
console.log('1. Make sure your Next.js dev server is running (npm run dev)');
console.log('2. Log in to the admin dashboard');
console.log('3. Open browser DevTools > Network tab');
console.log('4. Navigate to the Payments page');
console.log('5. Look for the request to /api/admin/payments/reports/stats');
console.log('6. Check the response data\n');

console.log('Expected Response:');
console.log({
  totalRevenue: 7490,
  netRevenue: 1340.83,
  totalRefunds: 200,
  activeEnrollments: 2,
  pendingPayments: 5,
  pendingAmount: 4326.68,
  overduePayments: 0,
  thisMonthRevenue: 1540.83,
  revenueGrowth: 0,
  recentPayments: []
});
