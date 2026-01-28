/**
 * Manifest manager utility
 *
 * Handles loading, updating, and saving the image manifest
 */

const fs = require('fs-extra');

/**
 * Load existing manifest or create empty one
 */
async function loadManifest(manifestPath) {
  if (await fs.pathExists(manifestPath)) {
    try {
      const manifest = await fs.readJSON(manifestPath);
      console.log(`📋 Loaded existing manifest with ${Object.keys(manifest.images || {}).length} images`);
      return manifest;
    } catch (error) {
      console.warn(`⚠️  Failed to read manifest, creating new one:`, error.message);
    }
  }

  console.log(`📋 Creating new manifest`);
  return {
    version: '1.0',
    generated: null,
    images: {}
  };
}

/**
 * Update manifest with new image entry
 */
function updateManifest(manifest, filename, result) {
  manifest.images[filename] = result;
  manifest.generated = new Date().toISOString();
}

/**
 * Save manifest to file
 */
async function saveManifest(manifestPath, manifest) {
  await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
  console.log(`\n💾 Manifest saved to ${manifestPath}`);
  console.log(`   Total images: ${Object.keys(manifest.images).length}`);
}

/**
 * Check if image needs optimization
 *
 * Returns true if:
 * - force flag is true
 * - image not in manifest
 * - source file is newer than manifest entry
 */
async function needsOptimization(filename, imagePath, manifest, force) {
  if (force) {
    return true;
  }

  if (!manifest.images[filename]) {
    return true;
  }

  // Check if source file is newer than manifest generation time
  const stats = await fs.stat(imagePath);
  const manifestDate = new Date(manifest.generated || 0);
  const fileDate = new Date(stats.mtime);

  return fileDate > manifestDate;
}

module.exports = {
  loadManifest,
  updateManifest,
  saveManifest,
  needsOptimization
};
