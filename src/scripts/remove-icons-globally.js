#!/usr/bin/env node

/**
 * Remove Icons Globally Script
 * 
 * This script removes all emojis and icons from the codebase globally.
 * It replaces them with text equivalents or removes them entirely.
 * 
 * @author LuxGen Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Icon mappings - map icons to their text equivalents
const iconMappings = {
  '\u2705': '', // checkmark
  '\u274C': '', // X
  '\u26A0\uFE0F': 'WARNING:', // warning
  '\u{1F504}': '', // reload
  '\u{1F4CA}': '', // chart
  '\u{1F4C1}': '', // folder
  '\u{1F50D}': '', // search
  '\u{1F310}': '', // globe
  '\u{1F4CD}': '', // location
  '\u{1F550}': '', // clock
  '\u{1F680}': '', // rocket
  '\u{1F389}': '', // celebration
  '\u{1F4A5}': '', // boom
  '\u{1F6D1}': '', // stop
  '\u{1F510}': '', // lock
  '\u{1F4DD}': '', // note
  '\u{1F9F9}': '', // broom
  '\u{1F4A1}': '', // bulb
  '\u{1F527}': '', // wrench
  '\u{1F4C8}': '', // chart up
  '\u{1F6E1}\uFE0F': '', // shield
  '\u26A1': '', // lightning
  '\u{1F9EA}': '', // test tube
  '\u{1F4DA}': '', // books
  '\u{1F3AF}': '', // target
  '\u{1F512}': '', // lock
  '\u{1F4C4}': '', // document
  '\u{1F331}': '', // seedling
  '\u{1F4E1}': '', // satellite
  '\u{1F5C4}\uFE0F': '', // file cabinet
  '\u{1F511}': '', // key
  '\u2139\uFE0F': '', // info
  '\u231B': '', // hourglass
  '\u23F0': '' // alarm
};

// Directories to process
const dirsToProcess = [
  'src',
  'scripts',
  'docs'
];

// File extensions to process
const extensions = ['.js', '.ts', '.md'];

let filesProcessed = 0;
let iconsRemoved = 0;

/**
 * Remove icons from a file
 */
function removeIconsFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileIconsRemoved = 0;

    // Replace each icon with its text equivalent
    for (const [icon, replacement] of Object.entries(iconMappings)) {
      const regex = new RegExp(icon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        fileIconsRemoved += matches.length;
        if (replacement) {
          content = content.replace(regex, ` ${replacement} `);
        } else {
          content = content.replace(regex, '');
        }
      }
    }

    // Clean up multiple spaces
    content = content.replace(/\s{2,}/g, ' ');
    
    // Clean up spaces around colons
    content = content.replace(/\s+:/g, ':');
    
    // Clean up leading spaces in strings
    content = content.replace(/'(\s+)/g, "'");
    content = content.replace(/"(\s+)/g, '"');

    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesProcessed++;
      iconsRemoved += fileIconsRemoved;
      console.log(`Processed: ${filePath} (${fileIconsRemoved} icons removed)`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          processDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          removeIconsFromFile(fullPath);
        }
      }
    });
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

/**
 * Main function
 */
function main() {
  console.log('='.repeat(80));
  console.log('REMOVING ICONS GLOBALLY FROM CODEBASE');
  console.log('='.repeat(80));

  dirsToProcess.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`\nProcessing directory: ${dir}`);
      processDirectory(dir);
    } else {
      console.log(`\nDirectory not found: ${dir}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('ICON REMOVAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Icons removed: ${iconsRemoved}`);
  console.log('='.repeat(80));
  console.log('\nIcon removal completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { removeIconsFromFile, processDirectory };
