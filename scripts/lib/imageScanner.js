/**
 * Image scanner utility
 *
 * Scans directories for image files
 */

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

/**
 * Scan for images based on input path
 *
 * @param {string|undefined} input - File, directory, or undefined for default
 * @param {string} defaultDir - Default directory to scan if input is undefined
 * @returns {Promise<string[]>} - Array of absolute paths to image files
 */
async function scanImages(input, defaultDir = './public/img') {
  let pattern;

  if (!input) {
    // Default: scan public/img/, exclude optimized and lqip folders
    pattern = path.join(defaultDir, '*.{jpg,jpeg,png,JPG,JPEG,PNG}');
    console.log(`🔍 Scanning default directory: ${defaultDir}`);
  } else if (await isFile(input)) {
    // Single file
    console.log(`🔍 Processing single file: ${input}`);
    return [path.resolve(input)];
  } else if (await isDirectory(input)) {
    // Directory - scan recursively
    pattern = path.join(input, '**/*.{jpg,jpeg,png,JPG,JPEG,PNG}');
    console.log(`🔍 Scanning directory: ${input}`);
  } else {
    throw new Error(`Input path not found: ${input}`);
  }

  // Use glob to find files
  const files = await glob(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/optimized/**',
      '**/lqip/**'
    ],
    nodir: true,
    absolute: true
  });

  // Filter out files in optimized or lqip directories, and files with .lqip. in name
  const filtered = files.filter(file => {
    const normalized = path.normalize(file);
    const basename = path.basename(file);
    return !normalized.includes('/optimized/') &&
           !normalized.includes('/lqip/') &&
           !normalized.includes('\\optimized\\') &&
           !normalized.includes('\\lqip\\') &&
           !basename.includes('.lqip.'); // Exclude any .lqip.* files
  });

  console.log(`   Found ${filtered.length} images to process`);

  return filtered;
}

/**
 * Check if path is a file
 */
async function isFile(filepath) {
  try {
    const stats = await fs.stat(filepath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Check if path is a directory
 */
async function isDirectory(filepath) {
  try {
    const stats = await fs.stat(filepath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

module.exports = {
  scanImages
};
