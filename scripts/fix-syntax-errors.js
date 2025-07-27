#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining syntax errors...');

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

// Function to fix syntax errors in a file
function fixFileSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixed = false;

    // Fix async const function declarations
    content = content.replace(/async const (\w+)\s*=\s*\(([^)]*)\)\s*{/g, 'const $1 = async ($2) => {');
    
    // Fix regular const function declarations
    content = content.replace(/const (\w+)\s*=\s*\(([^)]*)\)\s*{/g, 'const $1 = ($2) => {');
    
    // Fix function declarations that end with }
    content = content.replace(/}\s*$/gm, '};');

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
    if (fixFileSyntax(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} files with syntax errors`);
  console.log('✅ All syntax errors should now be resolved');
  
} catch (error) {
  console.error('❌ Error during syntax fix:', error.message);
  process.exit(1);
} 