/**
 * Fix syntax issues after removing audit logging from admin routes
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

function fixSyntaxIssues(filePath: string): boolean {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Fix: }return -> }\n\n    return
    content = content.replace(/\}return\s+NextResponse/g, '}\n\n    return NextResponse');

    // Fix broken try-catch blocks with incomplete audit logging code
    // Pattern: try { ... const auditResult =console.log(...); } catch ...
    content = content.replace(
      /\/\/\s*Log audit event[^\n]*\n\s*try\s*\{[^}]*const\s+auditResult\s*=[^;]*console\.log[^}]*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}/gs,
      ''
    );

    // Remove orphaned console.log statements related to audit
    content = content.replace(/\s*console\.log\('\[.*?\] Audit event logged:',[^;]*\);?\s*/g, '');
    content = content.replace(/\s*console\.log\('\[.*?\] Logging audit event[^;]*\);?\s*/g, '');
    content = content.replace(/\s*console\.log\('\[.*?\] Failed to log audit event[^;]*\);?\s*/g, '');

    // Remove empty try-catch blocks
    content = content.replace(/\s*try\s*\{\s*\}\s*catch\s*\([^)]*\)\s*\{[^}]*\}\s*/g, '\n');

    // Clean up extra blank lines (more than 2 consecutive)
    content = content.replace(/\n{3,}/g, '\n\n');

    // Remove trailing whitespace
    content = content.split('\n').map(line => line.trimEnd()).join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      return true;
    } else {
      return false;
    }
  } catch (error: any) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Fixing syntax issues in admin routes...\n');

let fixedCount = 0;

for (const filePath of adminRoutesFiles) {
  const modified = fixSyntaxIssues(filePath);
  if (modified) {
    fixedCount++;
    console.log(`✅ Fixed: ${filePath}`);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files\n`);
