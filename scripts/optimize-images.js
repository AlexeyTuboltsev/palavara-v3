#!/usr/bin/env node

/**
 * Image Optimization CLI
 *
 * Command-line tool for optimizing images using the core imageOptimizer module
 *
 * Usage:
 *   node scripts/optimize-images.js                          # Process all images in /public/img/
 *   node scripts/optimize-images.js path/to/image.jpg       # Process single file
 *   node scripts/optimize-images.js path/to/dir/            # Process directory
 *   node scripts/optimize-images.js --force                 # Re-optimize all images
 *   node scripts/optimize-images.js --dry-run               # Show what would be done
 *   node scripts/optimize-images.js --jpeg-quality 90       # Custom quality settings
 */

const path = require('path');
const { scanImages } = require('./lib/imageScanner');
const { loadManifest, updateManifest, saveManifest, needsOptimization } = require('./lib/manifestManager');

// Parse command line arguments
function parseArgs(argv) {
  const args = {
    input: null,
    force: false,
    dryRun: false,
    options: {}
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--force') {
      args.force = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--jpeg-quality' && argv[i + 1]) {
      args.options.jpegQuality = parseInt(argv[++i], 10);
    } else if (arg === '--webp-quality' && argv[i + 1]) {
      args.options.webpQuality = parseInt(argv[++i], 10);
    } else if (arg === '--avif-quality' && argv[i + 1]) {
      args.options.avifQuality = parseInt(argv[++i], 10);
    } else if (arg === '--lqip-quality' && argv[i + 1]) {
      args.options.lqipQuality = parseInt(argv[++i], 10);
    } else if (arg === '--lqip-width' && argv[i + 1]) {
      args.options.lqipWidth = parseInt(argv[++i], 10);
    } else if (!arg.startsWith('--')) {
      args.input = arg;
    }
  }

  return args;
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
 * Print final report
 */
function printReport(results, originalTotalSize, optimizedTotalSize) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION REPORT');
  console.log('='.repeat(60));

  if (results.length === 0) {
    console.log('No images were optimized.');
    return;
  }

  console.log(`\nImages optimized: ${results.length}`);
  console.log(`Original total size: ${formatBytes(originalTotalSize)}`);
  console.log(`Optimized total size: ${formatBytes(optimizedTotalSize)}`);
  console.log(`Total savings: ${formatBytes(originalTotalSize - optimizedTotalSize)} (${Math.round((originalTotalSize - optimizedTotalSize) / originalTotalSize * 100)}%)`);

  // Calculate average savings per format
  const jpegSavings = results.reduce((acc, r) => acc + (r.original.size - r.optimized.jpeg.size), 0);
  const webpSavings = results.reduce((acc, r) => acc + (r.original.size - r.optimized.webp.size), 0);
  const avifSavings = results.reduce((acc, r) => acc + (r.original.size - r.optimized.avif.size), 0);

  console.log(`\nFormat savings (vs original):`);
  console.log(`  JPEG: ${Math.round(jpegSavings / originalTotalSize * 100)}% average`);
  console.log(`  WebP: ${Math.round(webpSavings / originalTotalSize * 100)}% average`);
  console.log(`  AVIF: ${Math.round(avifSavings / originalTotalSize * 100)}% average`);

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Main function
 */
async function main() {
  console.log('🎨 Image Optimization Tool\n');

  const args = parseArgs(process.argv);

  if (args.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  try {
    // Import the image optimizer module
    const { optimizeImage } = require('../src/services/imageOptimizer.js');

    // Scan for images
    const images = await scanImages(args.input);

    if (images.length === 0) {
      console.log('❌ No images found to process');
      return;
    }

    // Load manifest
    const manifestPath = path.resolve('./public/img/image-manifest.json');
    const manifest = await loadManifest(manifestPath);

    // Filter images that need optimization
    const toOptimize = [];
    for (const imagePath of images) {
      const filename = path.basename(imagePath);
      const needs = await needsOptimization(filename, imagePath, manifest, args.force);

      if (needs) {
        toOptimize.push({ path: imagePath, filename });
      } else {
        console.log(`⏭️  Skipping ${filename} (already optimized, use --force to re-optimize)`);
      }
    }

    if (toOptimize.length === 0) {
      console.log('\n✅ All images are already optimized!');
      console.log('   Use --force to re-optimize all images');
      return;
    }

    console.log(`\n🚀 Optimizing ${toOptimize.length} images...\n`);

    if (args.dryRun) {
      console.log('Would optimize:');
      toOptimize.forEach(img => console.log(`  - ${img.filename}`));
      return;
    }

    // Process each image
    const results = [];
    let originalTotalSize = 0;
    let optimizedTotalSize = 0;

    for (const { path: imagePath, filename } of toOptimize) {
      try {
        const result = await optimizeImage(imagePath, './public/img', args.options);
        updateManifest(manifest, filename, result);
        results.push(result);

        originalTotalSize += result.original.size;
        optimizedTotalSize += result.optimized.jpeg.size; // Use JPEG as baseline
      } catch (error) {
        console.error(`❌ Failed to optimize ${filename}:`, error.message);
      }
    }

    // Save manifest
    if (results.length > 0) {
      await saveManifest(manifestPath, manifest);
    }

    // Print report
    printReport(results, originalTotalSize, optimizedTotalSize);

    console.log('✅ Optimization complete!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
main();
