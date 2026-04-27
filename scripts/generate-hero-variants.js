#!/usr/bin/env node
/**
 * Generate responsive variants of hero images at 640w and 1280w.
 *
 * The full optimize-images pipeline produces single 1920w variants per format.
 * For mobile LCP we want a much smaller image — this one-off script creates
 * the additional variants without touching the manifest schema.
 *
 * Output filenames: {base}-640.{avif,webp,jpg} and {base}-1280.{avif,webp,jpg}
 * alongside the existing {base}.{avif,webp,jpg}.
 *
 * Bases covered:
 *   - home-1..home-7 (the home carousel)
 *   - The first image in every section's saga url[] (the LCP image for that page).
 *
 * Keep in sync with RESPONSIVE_HERO_BASES in src/services/imageService.ts.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const WIDTHS = [640, 1280];
const QUALITY = { jpeg: 85, webp: 80, avif: 65 };
const SOURCE_DIR = path.join(__dirname, '..', 'public', 'img');

const HOME_BASES = Array.from({ length: 7 }, (_, i) => `home-${i + 1}`);
const SECTION_BASES = [
  '01-01', // familySaturday
  '02-01', // kidsClass
  '04-01', // wheelThrowing
  '05-01', // about
  '06-01', // firingService
  '07-01', // membership
  '08-01', // openStudio
  '09-01', // rentASpace
  '10-01', // giftCertificate
  '2025-10-24-155119_002', // teamEvents, birthdayParties
];
const BASES = [...HOME_BASES, ...SECTION_BASES];

async function generateVariants(base) {
  const sourceFile = path.join(SOURCE_DIR, `${base}.jpg`);
  if (!fs.existsSync(sourceFile)) {
    console.log(`skip ${base} (source not found)`);
    return;
  }
  const buf = await fs.promises.readFile(sourceFile);
  for (const w of WIDTHS) {
    const outBase = path.join(SOURCE_DIR, `${base}-${w}`);
    await sharp(buf).resize(w, null, { withoutEnlargement: true })
      .avif({ quality: QUALITY.avif }).toFile(`${outBase}.avif`);
    await sharp(buf).resize(w, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY.webp }).toFile(`${outBase}.webp`);
    await sharp(buf).resize(w, null, { withoutEnlargement: true })
      .jpeg({ quality: QUALITY.jpeg, progressive: true }).toFile(`${outBase}.jpg`);
  }
  console.log(`✓ ${base}: generated ${WIDTHS.length * 3} variants`);
}

async function main() {
  for (const b of BASES) await generateVariants(b);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
