/**
 * Remove all audit logging code from the application
 * This will:
 * 1. Remove all logAuditEvent imports and calls
 * 2. Clean up any orphaned code
 * 3. List files that should be manually deleted (audit service files, UI pages)
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CleanupResult {
  modified: string[];
  errors: string[];
  filesToDelete: string[];
}

const result: CleanupResult = {
  modified: [],
  errors: [],
  filesToDelete: []
};

// Files to delete manually (can't auto-delete as they may be needed for reference)
const filesToDelete = [
  'src/lib/audit/logger.ts',
  'src/lib/audit/auditService.ts',
  'src/app/api/audit/events/route.ts',
  'src/app/api/user/profile/audit/route.ts',
  'src/app/admin/audit/page.tsx',
  'src/components/audit/AuditEventsTable.tsx',
];

function removeAuditCode(filePath: string): boolean {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Remove import statements for audit logging
    content = content.replace(/import\s+\{[^}]*logAuditEvent[^}]*\}\s+from\s+['"]@\/lib\/audit\/auditService['"];?\s*/g, '');
    content = content.replace(/import\s+\{[^}]*logAuditEvent[^}]*\}\s+from\s+['"]@\/lib\/audit\/logger['"];?\s*/g, '');

    // Remove logAuditEvent function calls with various patterns
    // Pattern 1: Simple await logAuditEvent(...)
    content = content.replace(/\s*await\s+logAuditEvent\s*\([^;]*?\)\s*\.catch\([^)]*\)[^;]*;?\s*/gs, '\n');
    content = content.replace(/\s*await\s+logAuditEvent\s*\(\{[^}]*\}\s*\)\s*\.catch\([^)]*\)\s*;?\s*/gs, '\n');
    content = content.replace(/\s*await\s+logAuditEvent\s*\(\{[\s\S]*?\}\s*\)\s*;?\s*/g, '\n');
    content = content.replace(/\s*logAuditEvent\s*\(\{[\s\S]*?\}\s*\)\s*\.catch\([^)]*\)\s*;?\s*/g, '\n');

    // Pattern 2: Comments before audit calls
    content = content.replace(/\s*\/\/[^\n]*[Aa]udit[^\n]*\n\s*await\s+logAuditEvent[^;]*;?\s*/g, '\n');
    content = content.replace(/\s*\/\/[^\n]*[Ll]og[^\n]*\n\s*await\s+logAuditEvent[^;]*;?\s*/g, '\n');

    // Pattern 3: Direct inserts to audit_events table
    content = content.replace(/\s*await\s+\w+\.from\s*\(\s*['"]audit_events['"]\s*\)\.insert\s*\(\{[\s\S]*?\}\s*\)\s*;?\s*/g, '\n');

    // Remove variable declarations related to audit
    content = content.replace(/\s*const\s+auditResult\s*=\s*await\s+logAuditEvent[^;]*;?\s*/g, '\n');

    // Remove tenantId variables that are ONLY used for audit logging
    // Be careful here - only remove if it's clearly only for audit
    const hasTenantIdInAudit = originalContent.includes('tenantId') && originalContent.includes('logAuditEvent');
    const hasTenantIdElsewhere = content.includes('tenantId') && !content.includes('logAuditEvent');

    if (hasTenantIdInAudit && !hasTenantIdElsewhere) {
      // Remove tenantId declarations if only used for audit
      content = content.replace(/\s*let\s+tenantId:\s*string\s*\|\s*undefined;?\s*/g, '\n');
      content = content.replace(/\s*tenantId\s*=\s*tenantUser\?\.tenant_id;?\s*/g, '\n');
    }

    // Clean up extra blank lines (more than 2 consecutive)
    content = content.replace(/\n{4,}/g, '\n\n\n');

    // Remove trailing whitespace
    content = content.split('\n').map(line => line.trimEnd()).join('\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf-8');
      return true;
    }
    return false;
  } catch (error: any) {
    result.errors.push(`${filePath}: ${error.message}`);
    return false;
  }
}

async function cleanupAuditCode() {
  console.log('🧹 Removing all audit logging code from the application...\n');

  // Find all TypeScript files in src/app/api
  const apiFiles = await glob('src/app/api/**/*.ts', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**']
  });

  console.log(`Found ${apiFiles.length} API route files to check\n`);

  for (const file of apiFiles) {
    const modified = removeAuditCode(file);
    if (modified) {
      result.modified.push(file);
      console.log(`  ✅ Cleaned: ${file}`);
    }
  }

  console.log('\n📋 Files that should be manually deleted:\n');
  for (const file of filesToDelete) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      result.filesToDelete.push(file);
      console.log(`  🗑️  ${file}`);
    } else {
      console.log(`  ⚠️  Not found: ${file}`);
    }
  }

  console.log('\n📊 Summary:\n');
  console.log(`  Modified: ${result.modified.length} files`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`  To delete: ${result.filesToDelete.length} files`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors encountered:\n');
    result.errors.forEach(err => console.log(`  ${err}`));
  }

  if (result.modified.length > 0) {
    console.log('\n✅ Cleanup complete! Review the changes before committing.\n');
  } else {
    console.log('\n✅ No audit logging code found in API routes.\n');
  }

  // Write deletion script
  if (result.filesToDelete.length > 0) {
    const deleteScript = result.filesToDelete.map(f => `# rm ${f}`).join('\n');
    console.log('To delete the audit files, run:\n');
    result.filesToDelete.forEach(f => console.log(`  rm ${f}`));
    console.log('');
  }
}

cleanupAuditCode();
