/**
 * Remove audit logging from user READ operations (except lesson access)
 * Keep audit logging for:
 * - User profile CHANGES (modifications)
 * - Lesson access (viewing lessons, recordings, joining)
 */

import * as fs from 'fs';
import * as path from 'path';

// Files to remove READ audit logging from
const filesToClean = [
  {
    path: 'src/app/api/user/dashboard/route.ts',
    description: 'Dashboard READ',
  },
  {
    path: 'src/app/api/user/courses/route.ts',
    description: 'Courses list READ',
  },
  {
    path: 'src/app/api/user/courses/[id]/grades/route.ts',
    description: 'Grades READ',
  },
  {
    path: 'src/app/api/user/courses/[id]/attendance/route.ts',
    description: 'Attendance READ',
  },
  {
    path: 'src/app/api/user/invoices/route.ts',
    description: 'Invoices READ',
  },
  {
    path: 'src/app/api/user/preferences/language/route.ts',
    description: 'Language preferences',
  },
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
    content = content.replace(/import\s+\{[^}]*logAuditEvent[^}]*\}\s+from\s+['"]@\/lib\/audit\/logger['"];?\s*/g, '');

    // Remove audit log comments and function calls
    content = content.replace(/\s*\/\/[^\n]*[Aa]udit[^\n]*\n\s*await\s+logAuditEvent\s*\([^;]*\);?\s*/g, '\n');
    content = content.replace(/\s*await\s+logAuditEvent\s*\([^;]*\);?\s*/g, '\n');

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

console.log('Removing audit logging from user READ operations...\n');

let modifiedCount = 0;

for (const file of filesToClean) {
  console.log(`Processing: ${file.description}`);
  const modified = removeAuditLogging(file.path);
  if (modified) {
    modifiedCount++;
    console.log(`  ✅ Removed audit logging from ${file.path}`);
  } else {
    console.log(`  ℹ️  No changes needed for ${file.path}`);
  }
  console.log('');
}

console.log(`✅ Modified ${modifiedCount} files\n`);
