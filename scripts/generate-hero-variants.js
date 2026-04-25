#!/usr/bin/env node
/**
 * Generate responsive variants of the home hero images at 640w and 1280w.
 *
 * The full optimize-images pipeline produces single 1920w variants per format.
 * For mobile LCP we want a much smaller image — this one-off script creates
 * the additional variants without touching the manifest schema.
 *
 * Output filenames: home-N-640.{avif,webp,jpg} and home-N-1280.{avif,webp,jpg}
 * alongside the existing home-N.{avif,webp,jpg}.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const WIDTHS = [640, 1280];
const QUALITY = { jpeg: 85, webp: 80, avif: 65 };
const SOURCE_DIR = path.join(__dirname, '..', 'public', 'img');

async function generateVariants(sourceFile) {
  const buf = await fs.promises.readFile(sourceFile);
  const name = path.parse(sourceFile).name; // 'home-1' from 'home-1.jpg'

  for (const w of WIDTHS) {
    const outBase = path.join(SOURCE_DIR, `${name}-${w}`);
    await sharp(buf).resize(w, null, { withoutEnlargement: true })
      .avif({ quality: QUALITY.avif }).toFile(`${outBase}.avif`);
    await sharp(buf).resize(w, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY.webp }).toFile(`${outBase}.webp`);
    await sharp(buf).resize(w, null, { withoutEnlargement: true })
      .jpeg({ quality: QUALITY.jpeg, progressive: true }).toFile(`${outBase}.jpg`);
  }

  console.log(`✓ ${name}: generated ${WIDTHS.length * 3} variants`);
}

async function main() {
  for (let i = 1; i <= 7; i++) {
    const src = path.join(SOURCE_DIR, `home-${i}.jpg`);
    if (!fs.existsSync(src)) {
      console.log(`skip ${src} (not found)`);
      continue;
    }
    await generateVariants(src);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
