/**
 * Final cleanup - remove all remaining broken audit logging code
 */

import * as fs from 'fs';
import * as path from 'path';

const adminRoutesFiles = [
  'src/app/api/admin/payments/transactions/[id]/refund/route.ts',
  'src/app/api/admin/languages/route.ts',
  'src/app/api/admin/theme/route.ts',
  'src/app/api/admin/settings/route.ts',
  'src/app/api/admin/programs/[id]/courses/[courseId]/route.ts',
  'src/app/api/admin/programs/[id]/courses/route.ts',
  'src/app/api/admin/payments/schedules/[id]/record-payment/route.ts',
  'src/app/api/admin/payments/schedules/[id]/adjust/route.ts',
  'src/app/api/admin/payments/products/[id]/route.ts',
  'src/app/api/admin/payments/products/route.ts',
  'src/app/api/admin/payments/plans/[id]/route.ts',
  'src/app/api/admin/payments/plans/route.ts',
  'src/app/api/admin/payments/enrollments/[id]/pause/route.ts',
  'src/app/api/admin/payments/enrollments/[id]/resume/route.ts',
  'src/app/api/admin/enrollments/[id]/cancel/route.ts',
];

function finalCleanup(filePath: string): boolean {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Remove any remaining audit-related try-catch blocks
    // Pattern: // Log audit ... try { ... } catch (...) { ... }
    content = content.replace(
      /\s*\/\/\s*Log\s+audit[^\n]*\n\s*try\s*\{[^}]*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/gs,
      '\n'
    );

    // Remove standalone broken try-catch with audit code
    content = content.replace(
      /\s*try\s*\{\s*const\s+auditResult\s*=[^}]*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/gs,
      '\n'
    );

    // Remove any lines that are just comments about audit trail
    content = content.replace(/\s*\/\/\s*Get\s+old\s+values\s+for\s+audit\s+trail[^\n]*\n/gi, '\n');

    // Remove orphaned "const { data: oldTheme }" that was only used for audit
    // But keep it if it's actually used elsewhere - check if oldTheme is referenced after
    const lines = content.split('\n');
    const filteredLines = lines.filter((line, index) => {
      // Check if this line is getting oldTheme/oldPlan/oldProduct etc for audit
      if (/const\s*\{\s*data:\s*old\w+\s*\}\s*=\s*await/.test(line)) {
        // Check if the variable is used in any subsequent lines
        const varMatch = line.match(/data:\s*(old\w+)/);
        if (varMatch) {
          const varName = varMatch[1];
          const remainingLines = lines.slice(index + 1);
          const isUsed = remainingLines.some(l => l.includes(varName));
          return isUsed; // Keep only if used later
        }
      }
      return true;
    });
    content = filteredLines.join('\n');

    // Clean up extra blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    // Remove trailing whitespace
    content = content.split('\n').map(line => line.trimEnd()).join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Final cleanup of admin routes...\n');

let fixedCount = 0;

for (const filePath of adminRoutesFiles) {
  const modified = finalCleanup(filePath);
  if (modified) {
    fixedCount++;
    console.log(`✅ Cleaned: ${filePath}`);
  }
}

console.log(`\n✅ Cleaned ${fixedCount} files\n`);
