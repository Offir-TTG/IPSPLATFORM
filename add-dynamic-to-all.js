const fs = require('fs');
const path = require('path');

function addDynamicExportToFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file already has 'export const dynamic'
  if (content.includes('export const dynamic')) {
    console.log(`✓ Skipped (already has dynamic): ${filePath}`);
    return false;
  }

  // Check if file uses createClient (which uses cookies)
  if (!content.includes('createClient')) {
    console.log(`✓ Skipped (no createClient): ${filePath}`);
    return false;
  }

  // Find the first import statement
  const lines = content.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import ')) {
      // Find the last import
      insertIndex = i;
    } else if (insertIndex !== -1 && lines[i].trim() && !lines[i].startsWith('import')) {
      // Found first non-import line after imports
      break;
    }
  }

  if (insertIndex === -1) {
    console.log(`✗ Failed (no imports found): ${filePath}`);
    return false;
  }

  // Insert after last import + empty line
  lines.splice(insertIndex + 1, 0, '');
  lines.splice(insertIndex + 2, 0, 'export const dynamic = \'force-dynamic\';');

  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ Added dynamic export: ${filePath}`);
  return true;
}

function findApiRoutes(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findApiRoutes(filePath);
    } else if (file === 'route.ts') {
      addDynamicExportToFile(filePath);
    }
  }
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
console.log('Adding dynamic export to all API routes...\n');
findApiRoutes(apiDir);
console.log('\n✅ Done!');
