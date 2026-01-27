/**
 * Remove audit logging imports from @/lib/audit/logger in admin routes
 */

import * as fs from 'fs';
import * as path from 'path';

const files = [
  'src/app/api/admin/enrollments/[id]/cancel/route.ts',
  'src/app/api/admin/payments/enrollments/[id]/pause/route.ts',
  'src/app/api/admin/payments/enrollments/[id]/resume/route.ts',
  'src/app/api/admin/payments/plans/route.ts',
  'src/app/api/admin/payments/plans/[id]/route.ts',
  'src/app/api/admin/payments/products/route.ts',
  'src/app/api/admin/payments/products/[id]/route.ts',
  'src/app/api/admin/payments/schedules/[id]/adjust/route.ts',
  'src/app/api/admin/payments/schedules/[id]/record-payment/route.ts',
  'src/app/api/admin/payments/transactions/[id]/refund/route.ts',
  'src/app/api/admin/programs/[id]/courses/route.ts',
  'src/app/api/admin/programs/[id]/courses/[courseId]/route.ts',
];

function removeLoggerImports(filePath: string): boolean {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Remove import from @/lib/audit/logger
    content = content.replace(/import\s+\{[^}]*logAuditEvent[^}]*\}\s+from\s+['"]@\/lib\/audit\/logger['"];?\s*/g, '');

    // Remove any audit function calls
    content = content.replace(/\s*\/\/[^\n]*audit[^\n]*\n\s*await\s+logAuditEvent\s*\([^;]*\);?\s*/gi, '');
    content = content.replace(/\s*await\s+logAuditEvent\s*\([^;]*\);?\s*/g, '');

    // Clean up extra blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

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

console.log('Removing logger audit imports from admin routes...\n');

let fixedCount = 0;

for (const filePath of files) {
  const modified = removeLoggerImports(filePath);
  if (modified) {
    fixedCount++;
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files\n`);
