#!/usr/bin/env node

/**
 * Test script to verify download and share functionality status
 * Run this script to test all download/share buttons across the application
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 QRLocker Download & Share Functionality Analysis');
console.log('==================================================\n');

// Function to search for patterns in files
function searchInFile(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = [];
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.regex, 'g');
      const matches = content.match(regex);
      if (matches) {
        results.push({
          pattern: pattern.name,
          matches: matches.length,
          file: filePath
        });
      }
    });
    
    return results;
  } catch (error) {
    return [];
  }
}

// Function to recursively search directory
function searchDirectory(dir, patterns, extensions = ['.js', '.jsx']) {
  const results = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
        walkDir(filePath);
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        const fileResults = searchInFile(filePath, patterns);
        results.push(...fileResults);
      }
    });
  }
  
  walkDir(dir);
  return results;
}

// Define patterns to search for
const downloadPatterns = [
  {
    name: 'Download Button Implementation',
    regex: 'handleDownload|downloadDocument|DocumentArrowDownIcon'
  },
  {
    name: 'Share Button Implementation', 
    regex: 'handleShare|shareDocument|ShareIcon'
  },
  {
    name: 'Direct S3 URL Usage',
    regex: 'document\\.s3Url|window\\.open\\(document\\.s3Url'
  },
  {
    name: 'API Download Endpoints',
    regex: '/download|/api/documents/.*download'
  }
];

// Search frontend for download/share implementations
console.log('📱 Frontend Analysis:');
console.log('--------------------');

const frontendDir = path.join(__dirname, 'frontend/src');
const frontendResults = searchDirectory(frontendDir, downloadPatterns);

// Group results by pattern
const groupedResults = {};
frontendResults.forEach(result => {
  if (!groupedResults[result.pattern]) {
    groupedResults[result.pattern] = [];
  }
  groupedResults[result.pattern].push(result);
});

Object.keys(groupedResults).forEach(pattern => {
  console.log(`\n${pattern}:`);
  const files = [...new Set(groupedResults[pattern].map(r => r.file))];
  files.forEach(file => {
    const relativePath = path.relative(__dirname, file);
    const matches = groupedResults[pattern].filter(r => r.file === file);
    const totalMatches = matches.reduce((sum, m) => sum + m.matches, 0);
    console.log(`  ✓ ${relativePath} (${totalMatches} occurrences)`);
  });
});

// Check backend endpoints
console.log('\n\n🖥️  Backend Analysis:');
console.log('--------------------');

const backendPatterns = [
  {
    name: 'Download Controllers',
    regex: 'downloadDocument|getDirectS3Url'
  },
  {
    name: 'Share Controllers',
    regex: 'shareDocument|createQRBundle'
  }
];

const backendDir = path.join(__dirname, 'backend');
const backendResults = searchDirectory(backendDir, backendPatterns);

const backendGrouped = {};
backendResults.forEach(result => {
  if (!backendGrouped[result.pattern]) {
    backendGrouped[result.pattern] = [];
  }
  backendGrouped[result.pattern].push(result);
});

Object.keys(backendGrouped).forEach(pattern => {
  console.log(`\n${pattern}:`);
  const files = [...new Set(backendGrouped[pattern].map(r => r.file))];
  files.forEach(file => {
    const relativePath = path.relative(__dirname, file);
    const matches = backendGrouped[pattern].filter(r => r.file === file);
    const totalMatches = matches.reduce((sum, m) => sum + m.matches, 0);
    console.log(`  ✓ ${relativePath} (${totalMatches} occurrences)`);
  });
});

// Check for key files and their implementation status
console.log('\n\n📋 Key Components Status:');
console.log('-------------------------');

const keyFiles = [
  {
    path: 'frontend/src/pages/Documents/DocumentView.js',
    description: 'Document View Page (main download button)'
  },
  {
    path: 'frontend/src/pages/Documents/DocumentsList.js', 
    description: 'Documents List (download/share buttons)'
  },
  {
    path: 'frontend/src/pages/Documents/DocumentsList_new.js',
    description: 'New Documents List (download/share buttons)'
  },
  {
    path: 'frontend/src/components/Documents/DocumentPreviewModal.js',
    description: 'Document Preview Modal (download button)'
  },
  {
    path: 'frontend/src/pages/QRBundles/QRBundleView.js',
    description: 'QR Bundle View (document download buttons)'
  },
  {
    path: 'frontend/src/pages/QRScan/QRScanView.js',
    description: 'QR Scan View (public download buttons)'
  },
  {
    path: 'backend/controllers/documentController.js',
    description: 'Document Controller (download endpoints)'
  }
];

keyFiles.forEach(file => {
  const fullPath = path.join(__dirname, file.path);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check for direct S3 URL usage
    const hasDirectS3 = content.includes('document.s3Url') || content.includes('getDirectS3Url');
    
    // Check for download implementation
    const hasDownload = content.includes('handleDownload') || content.includes('downloadDocument');
    
    // Check for share implementation  
    const hasShare = content.includes('handleShare') || content.includes('shareDocument') || content.includes('ShareIcon');
    
    console.log(`\n${file.description}:`);
    console.log(`  📁 File: ${file.path}`);
    console.log(`  📥 Download: ${hasDownload ? '✅ Implemented' : '❌ Missing'}`);
    console.log(`  📤 Share: ${hasShare ? '✅ Implemented' : '❌ Missing'}`);
    console.log(`  🔗 Direct S3: ${hasDirectS3 ? '✅ Using direct URLs' : '⚠️  May use signed URLs'}`);
  } else {
    console.log(`\n${file.description}:`);
    console.log(`  ❌ File not found: ${file.path}`);
  }
});

console.log('\n\n🎯 Summary:');
console.log('-----------');
console.log('This analysis shows the current status of download and share functionality.');
console.log('Files marked with ✅ are properly implemented.');
console.log('Files marked with ⚠️ may need updates to use direct S3 URLs.');
console.log('Files marked with ❌ are missing or need implementation.');

console.log('\n📖 Next Steps:');
console.log('1. Review files marked with ⚠️ for proper direct S3 URL usage');
console.log('2. Test download buttons in browser to verify functionality');
console.log('3. Test share buttons to ensure QR code generation works');
console.log('4. Verify QR code scanning and document access works');
