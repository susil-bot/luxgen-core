#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all semicolon issues...');

// Function to recursively find all JavaScript files
function findJsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findJsFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to fix semicolons in a file
function fixSemicolons(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix semicolons after closing braces in object literals and function calls
    content = content.replace(/};\s*([}\]])/g, '} $1');
    content = content.replace(/};\s*\)/g, '} )');
    content = content.replace(/};\s*$/gm, '}');
    
    // Fix semicolons after closing braces in if/else blocks
    content = content.replace(/}\s*;\s*else/g, '} else');
    content = content.replace(/}\s*;\s*catch/g, '} catch');
    content = content.replace(/}\s*;\s*finally/g, '} finally');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      fixed = true;
    }

    return fixed;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
try {
  const srcDir = path.join(__dirname, '..', 'src');
  const jsFiles = findJsFiles(srcDir);
  
  console.log(`📁 Found ${jsFiles.length} JavaScript files to check`);
  
  let fixedCount = 0;
  
  for (const file of jsFiles) {
    if (fixSemicolons(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} files with semicolon issues`);
  console.log('✅ All semicolon issues should now be resolved');
  
} catch (error) {
  console.error('❌ Error during semicolon fix:', error.message);
  process.exit(1);
} 