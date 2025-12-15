/**
 * Test the rounding fix for payment schedules
 */

const totalAmount = 6960;
const depositAmount = 800;
const remainingAmount = totalAmount - depositAmount; // 6160
const installmentCount = 12;

// Old calculation (buggy)
const oldInstallmentAmount = remainingAmount / installmentCount; // 513.333...
const oldTotal = depositAmount + (oldInstallmentAmount * installmentCount);

console.log('❌ OLD CALCULATION (Buggy):');
console.log('  Deposit:', depositAmount);
console.log('  Each Installment:', oldInstallmentAmount);
console.log('  Total:', oldTotal);
console.log('  Discrepancy:', (totalAmount - oldTotal).toFixed(2));
console.log('');

// New calculation (fixed)
const baseInstallmentAmount = parseFloat((remainingAmount / installmentCount).toFixed(2)); // 513.33
const totalRoundedInstallments = baseInstallmentAmount * installmentCount; // 6159.96
const roundingAdjustment = parseFloat((remainingAmount - totalRoundedInstallments).toFixed(2)); // 0.04
const lastInstallmentAmount = parseFloat((baseInstallmentAmount + roundingAdjustment).toFixed(2)); // 513.37

const newTotal = depositAmount + (baseInstallmentAmount * (installmentCount - 1)) + lastInstallmentAmount;

console.log('✅ NEW CALCULATION (Fixed):');
console.log('  Deposit:', depositAmount);
console.log('  First 11 Installments:', baseInstallmentAmount, 'each');
console.log('  Last Installment:', lastInstallmentAmount, '(with +' + roundingAdjustment + ' adjustment)');
console.log('  Total:', newTotal);
console.log('  Discrepancy:', (totalAmount - newTotal).toFixed(2));
console.log('');

// Verify the schedule
console.log('📅 PAYMENT SCHEDULE:');
console.log('  1. Deposit: $' + depositAmount);
for (let i = 0; i < installmentCount; i++) {
  const isLast = i === installmentCount - 1;
  const amount = isLast ? lastInstallmentAmount : baseInstallmentAmount;
  console.log(`  ${i + 2}. Installment ${i + 1}: $${amount}`);
}
console.log('  ─────────────────────');
console.log('  Total: $' + newTotal);
