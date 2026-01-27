/**
 * Remove audit logging from all admin API routes
 */

import * as fs from 'fs';
import * as path from 'path';

const adminRoutesWithAudit = [
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

function removeAuditLogging(filePath: string): boolean {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Remove import statements for audit logging
    content = content.replace(/import\s+\{[^}]*logAuditEvent[^}]*\}\s+from\s+['"]@\/lib\/audit\/auditService['"];?\s*/g, '');
    content = content.replace(/import\s+\{[^}]*logConfigChange[^}]*\}\s+from\s+['"]@\/lib\/audit\/auditService['"];?\s*/g, '');

    // Also handle cases where both are imported together
    content = content.replace(/import\s+\{\s*logConfigChange,\s*logAuditEvent\s*\}\s+from\s+['"]@\/lib\/audit\/auditService['"];?\s*/g, '');
    content = content.replace(/import\s+\{\s*logAuditEvent,\s*logConfigChange\s*\}\s+from\s+['"]@\/lib\/audit\/auditService['"];?\s*/g, '');

    // Remove await logAuditEvent(...) calls
    // This regex matches the entire function call including multi-line arguments
    content = content.replace(/\s*\/\/[^\n]*audit[^\n]*\n\s*await\s+logAuditEvent\s*\([^;]*\);?\s*/gi, '');
    content = content.replace(/\s*await\s+logAuditEvent\s*\([^;]*\);?\s*/g, '');

    // Remove await logConfigChange(...) calls
    content = content.replace(/\s*\/\/[^\n]*audit[^\n]*\n\s*await\s+logConfigChange\s*\([^;]*\);?\s*/gi, '');
    content = content.replace(/\s*await\s+logConfigChange\s*\([^;]*\);?\s*/g, '');

    // Clean up extra blank lines (more than 2 consecutive newlines)
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      return true;
    } else {
      console.log(`  ℹ️  No changes needed: ${filePath}`);
      return false;
    }
  } catch (error: any) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Removing audit logging from admin routes...\n');

let processedCount = 0;
let modifiedCount = 0;

for (const filePath of adminRoutesWithAudit) {
  console.log(`Processing: ${filePath}`);
  const modified = removeAuditLogging(filePath);
  processedCount++;
  if (modified) {
    modifiedCount++;
    console.log(`  ✅ Removed audit logging`);
  }
}

console.log(`\n✅ Processed ${processedCount} files, modified ${modifiedCount} files\n`);
