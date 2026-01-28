/**
 * Core image optimization module using Sharp
 *
 * Generates optimized images with flat directory structure:
 * - filename.jpg (optimized JPEG, replaces original)
 * - filename.webp (WebP version)
 * - filename.avif (AVIF version)
 * - filename.lqip.jpg (tiny placeholder)
 */

const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Default optimization settings
const DEFAULT_OPTIONS = {
  jpegQuality: 85,
  webpQuality: 80,
  avifQuality: 65,
  lqipQuality: 30,
  lqipWidth: 10,
  maxWidth: 1920  // Resize to max 1920px width
};

/**
 * Main optimization function
 *
 * @param {string} inputPath - Absolute path to input image
 * @param {string} outputDir - Output directory (e.g., './public/img')
 * @param {Object} options - Optimization options
 * @returns {Promise<Object>} Manifest entry with all generated files and metadata
 */
async function optimizeImage(inputPath, outputDir, options = {}) {
  // Merge options with defaults
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  // Validate input file exists
  if (!await fs.pathExists(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const filename = path.basename(inputPath);
  const nameWithoutExt = path.parse(filename).name;

  console.log(`📷 Optimizing ${filename}...`);

  // Read original image into buffer (to avoid input/output conflicts)
  const inputBuffer = await fs.readFile(inputPath);
  const originalImage = sharp(inputBuffer);
  const metadata = await originalImage.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read image dimensions: ${inputPath}`);
  }

  const originalStats = await fs.stat(inputPath);

  // Ensure output directory exists
  await fs.ensureDir(outputDir);

  // Generate optimized images (resize if larger than maxWidth)
  console.log(`  ⚙️  Generating optimized formats...`);

  const jpegPath = path.join(outputDir, `${nameWithoutExt}.jpg`);
  const webpPath = path.join(outputDir, `${nameWithoutExt}.webp`);
  const avifPath = path.join(outputDir, `${nameWithoutExt}.avif`);
  const lqipPath = path.join(outputDir, `${nameWithoutExt}.lqip.jpg`);

  // JPEG (progressive, optimized, resized)
  await sharp(inputBuffer)
    .resize(opts.maxWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: opts.jpegQuality, progressive: true })
    .toFile(jpegPath);

  // WebP (resized)
  await sharp(inputBuffer)
    .resize(opts.maxWidth, null, { withoutEnlargement: true })
    .webp({ quality: opts.webpQuality })
    .toFile(webpPath);

  // AVIF (resized)
  await sharp(inputBuffer)
    .resize(opts.maxWidth, null, { withoutEnlargement: true })
    .avif({ quality: opts.avifQuality })
    .toFile(avifPath);

  const jpegStats = await fs.stat(jpegPath);
  const webpStats = await fs.stat(webpPath);
  const avifStats = await fs.stat(avifPath);

  console.log(`    JPEG: ${formatBytes(jpegStats.size)} (${calculateSavings(originalStats.size, jpegStats.size)}% savings)`);
  console.log(`    WebP: ${formatBytes(webpStats.size)} (${calculateSavings(originalStats.size, webpStats.size)}% savings)`);
  console.log(`    AVIF: ${formatBytes(avifStats.size)} (${calculateSavings(originalStats.size, avifStats.size)}% savings)`);

  // Generate LQIP (Low Quality Image Placeholder)
  console.log(`  ⚙️  Generating LQIP...`);

  const lqipBuffer = await sharp(inputBuffer)
    .resize(opts.lqipWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: opts.lqipQuality })
    .toBuffer();

  // Save LQIP to file (for development/debugging)
  await fs.writeFile(lqipPath, lqipBuffer);

  const lqipMetadata = await sharp(lqipBuffer).metadata();
  const lqipBase64 = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;

  console.log(`    LQIP: ${lqipMetadata.width}x${lqipMetadata.height}, ${formatBytes(lqipBuffer.length)}`);
  console.log(`  ✅ Optimization complete\n`);

  // Get final dimensions (after potential resize)
  const finalMetadata = await sharp(jpegPath).metadata();

  // Return manifest entry with simple paths
  return {
    original: {
      width: metadata.width,
      height: metadata.height,
      size: originalStats.size,
      format: metadata.format || 'jpeg'
    },
    optimized: {
      width: finalMetadata.width,
      height: finalMetadata.height,
      jpeg: {
        path: `${nameWithoutExt}.jpg`,
        size: jpegStats.size
      },
      webp: {
        path: `${nameWithoutExt}.webp`,
        size: webpStats.size
      },
      avif: {
        path: `${nameWithoutExt}.avif`,
        size: avifStats.size
      }
    },
    lqip: {
      width: lqipMetadata.width || opts.lqipWidth,
      height: lqipMetadata.height || Math.round((lqipMetadata.width || opts.lqipWidth) * metadata.height / metadata.width),
      base64: lqipBase64,
      path: `${nameWithoutExt}.lqip.jpg`
    }
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Calculate percentage savings
 */
function calculateSavings(original, optimized) {
  return Math.round(((original - optimized) / original) * 100);
}

module.exports = {
  optimizeImage
};
