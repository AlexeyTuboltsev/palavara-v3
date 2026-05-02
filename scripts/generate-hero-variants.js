#!/usr/bin/env node
/**
 * Generate responsive variants of hero images.
 *
 * The full optimize-images pipeline produces single 1920w variants per format.
 * For mobile LCP we want smaller images — this one-off script creates
 * the additional variants without touching the manifest schema.
 *
 * Output filenames: {base}-{640,768,1024,1280}.{avif,webp,jpg} alongside
 * the existing {base}.{avif,webp,jpg}.
 *
 * Bases covered:
 *   - home-1..home-7 (the home carousel)
 *   - The first image in every section's saga url[] (the LCP image for that page).
 *
 * Keep in sync with RESPONSIVE_HERO_BASES in src/services/imageService.ts.
 *
 * NOTE on Sharp version drift: The variants currently on the CDN
 * (s3://palavara-front-api/img/studio/) were produced by an earlier
 * Sharp version with effectively lower AVIF quality (~q47), giving
 * smaller bytes than this script produces today at QUALITY.avif=65.
 * Running `yarn deploy-images` with --delete will replace those
 * smaller files with the larger ones produced here, regressing LCP
 * across all hero pages. Until that's reconciled, only manually
 * upload variants for missing widths/bases — don't sync the whole
 * directory.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 768w covers the 412-viewport / DPR 1.75 sweet spot, 1024w covers
// the 360-viewport / DPR 2.625 case that PSI actually emulates (Moto
// G4: 360 × 2.625 = 945 device px → picks 1024w instead of jumping
// straight to 1280w, saving ~25% on the LCP image transfer).
const WIDTHS = [640, 768, 1024, 1280];
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
