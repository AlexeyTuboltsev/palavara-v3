/**
 * Core image optimization module using Sharp
 *
 * This module provides reusable image optimization functionality
 * that can be used by CLI scripts, upload APIs, and other tools.
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
  responsiveSizes: [1920, 1024, 640]
};

/**
 * Main optimization function
 *
 * @param {string} inputPath - Absolute path to input image
 * @param {string} outputDir - Base output directory (e.g., './public/img')
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

  // Read original image and get metadata
  const originalImage = sharp(inputPath);
  const metadata = await originalImage.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read image dimensions: ${inputPath}`);
  }

  const originalStats = await fs.stat(inputPath);

  // Create output directories
  const optimizedDir = path.join(outputDir, 'optimized');
  await fs.ensureDir(path.join(optimizedDir, 'jpeg'));
  await fs.ensureDir(path.join(optimizedDir, 'webp'));
  await fs.ensureDir(path.join(optimizedDir, 'avif'));

  for (const size of opts.responsiveSizes) {
    await fs.ensureDir(path.join(optimizedDir, 'responsive', 'jpeg', `${size}w`));
    await fs.ensureDir(path.join(optimizedDir, 'responsive', 'webp', `${size}w`));
    await fs.ensureDir(path.join(optimizedDir, 'responsive', 'avif', `${size}w`));
  }

  // Generate optimized full-size images
  console.log(`  ⚙️  Generating optimized formats...`);

  const jpegPath = path.join(optimizedDir, 'jpeg', filename);
  const webpPath = path.join(optimizedDir, 'webp', `${nameWithoutExt}.webp`);
  const avifPath = path.join(optimizedDir, 'avif', `${nameWithoutExt}.avif`);

  // JPEG (progressive, optimized)
  await sharp(inputPath)
    .jpeg({ quality: opts.jpegQuality, progressive: true })
    .toFile(jpegPath);

  // WebP
  await sharp(inputPath)
    .webp({ quality: opts.webpQuality })
    .toFile(webpPath);

  // AVIF
  await sharp(inputPath)
    .avif({ quality: opts.avifQuality })
    .toFile(avifPath);

  const jpegStats = await fs.stat(jpegPath);
  const webpStats = await fs.stat(webpPath);
  const avifStats = await fs.stat(avifPath);

  console.log(`    JPEG: ${formatBytes(jpegStats.size)} (${calculateSavings(originalStats.size, jpegStats.size)}% savings)`);
  console.log(`    WebP: ${formatBytes(webpStats.size)} (${calculateSavings(originalStats.size, webpStats.size)}% savings)`);
  console.log(`    AVIF: ${formatBytes(avifStats.size)} (${calculateSavings(originalStats.size, avifStats.size)}% savings)`);

  // Generate responsive variants
  console.log(`  ⚙️  Generating responsive variants...`);
  const responsiveVariants = {};

  for (const size of opts.responsiveSizes) {
    const jpegResponsivePath = path.join(optimizedDir, 'responsive', 'jpeg', `${size}w`, filename);
    const webpResponsivePath = path.join(optimizedDir, 'responsive', 'webp', `${size}w`, `${nameWithoutExt}.webp`);
    const avifResponsivePath = path.join(optimizedDir, 'responsive', 'avif', `${size}w`, `${nameWithoutExt}.avif`);

    // Resize and save JPEG
    await sharp(inputPath)
      .resize(size, null, { withoutEnlargement: true })
      .jpeg({ quality: opts.jpegQuality, progressive: true })
      .toFile(jpegResponsivePath);

    // Resize and save WebP
    await sharp(inputPath)
      .resize(size, null, { withoutEnlargement: true })
      .webp({ quality: opts.webpQuality })
      .toFile(webpResponsivePath);

    // Resize and save AVIF
    await sharp(inputPath)
      .resize(size, null, { withoutEnlargement: true })
      .avif({ quality: opts.avifQuality })
      .toFile(avifResponsivePath);

    const jpegResponsiveStats = await fs.stat(jpegResponsivePath);
    const webpResponsiveStats = await fs.stat(webpResponsivePath);
    const avifResponsiveStats = await fs.stat(avifResponsivePath);

    responsiveVariants[`${size}w`] = {
      jpeg: {
        path: `optimized/responsive/jpeg/${size}w/${filename}`,
        size: jpegResponsiveStats.size
      },
      webp: {
        path: `optimized/responsive/webp/${size}w/${nameWithoutExt}.webp`,
        size: webpResponsiveStats.size
      },
      avif: {
        path: `optimized/responsive/avif/${size}w/${nameWithoutExt}.avif`,
        size: avifResponsiveStats.size
      }
    };

    console.log(`    ${size}w: JPEG ${formatBytes(jpegResponsiveStats.size)}, WebP ${formatBytes(webpResponsiveStats.size)}, AVIF ${formatBytes(avifResponsiveStats.size)}`);
  }

  // Generate LQIP (Low Quality Image Placeholder)
  console.log(`  ⚙️  Generating LQIP...`);

  const lqipBuffer = await sharp(inputPath)
    .resize(opts.lqipWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: opts.lqipQuality })
    .toBuffer();

  const lqipMetadata = await sharp(lqipBuffer).metadata();
  const lqipBase64 = `data:image/jpeg;base64,${lqipBuffer.toString('base64')}`;

  console.log(`    LQIP: ${lqipMetadata.width}x${lqipMetadata.height}, ${formatBytes(lqipBuffer.length)}`);
  console.log(`  ✅ Optimization complete\n`);

  // Return manifest entry
  return {
    original: {
      width: metadata.width,
      height: metadata.height,
      size: originalStats.size,
      format: metadata.format || 'jpeg'
    },
    optimized: {
      jpeg: {
        path: `optimized/jpeg/${filename}`,
        size: jpegStats.size
      },
      webp: {
        path: `optimized/webp/${nameWithoutExt}.webp`,
        size: webpStats.size
      },
      avif: {
        path: `optimized/avif/${nameWithoutExt}.avif`,
        size: avifStats.size
      }
    },
    responsive: responsiveVariants,
    lqip: {
      width: lqipMetadata.width || opts.lqipWidth,
      height: lqipMetadata.height || Math.round((lqipMetadata.width || opts.lqipWidth) * metadata.height / metadata.width),
      base64: lqipBase64
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
