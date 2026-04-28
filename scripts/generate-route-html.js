#!/usr/bin/env node
/**
 * Post-build prerender for SEO.
 *
 * CRA serves the same build/index.html for every route, so non-JS clients
 * (Googlebot's first pass, Telegram/WhatsApp/Slack/FB previews, Bing, etc.)
 * see the home page's <title>, <meta>, OG tags and canonical URL on every
 * URL — making them look like duplicates of /. This script writes a copy
 * of index.html for each route with the route-specific tags substituted.
 *
 * Output: build/<slug>.html for each non-home route. The deploy step
 * uploads each one to s3://studio.palavara.com/<slug> (no extension)
 * with Content-Type: text/html, so CloudFront serves it directly when
 * /<slug> is requested. React still hydrates and runs as before.
 *
 * Keep ROUTES below in sync with src/services/seo.ts (pageMeta) and
 * src/router.ts (routeDefs). They're the source of truth — duplicated
 * here because this is plain Node, not TypeScript.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://studio.palavara.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/home-1.jpg`;

const ROUTES = [
  // path is excluded from the loop. Listed for completeness/symmetry.
  { path: '/',                         title: 'Palavara — Pottery Classes & Ceramics Studio in Berlin',  description: 'Learn pottery in Berlin at Palavara Studio. Wheel throwing, kids classes, open studio, memberships, team events and gift certificates at Steegerstr. 1A.' },
  { path: '/kids-class',               title: 'Kids Pottery Classes in Berlin | Palavara Studio',         description: 'Pottery classes for kids in Berlin at Palavara Studio. Creative, welcoming sessions at Steegerstr. 1A, 13359 Berlin.' },
  { path: '/wheel-throwing',           title: 'Wheel Throwing Classes in Berlin | Palavara',              description: 'Learn wheel throwing in Berlin at Palavara Studio. Courses for beginners and returners at Steegerstr. 1A, 13359 Berlin.' },
  { path: '/family-saturday',          title: 'Family Pottery Saturdays in Berlin | Palavara',            description: 'Family pottery workshops on Saturdays in Berlin. Make ceramics together with your kids at Palavara Studio, Steegerstr. 1A.' },
  { path: '/open-studio',              title: 'Open Studio Pottery Sessions in Berlin | Palavara',        description: 'Drop in and work on your pottery at Palavara open studio in Berlin. Wheels, hand-building tools and firing available at Steegerstr. 1A.' },
  { path: '/firing-service',           title: 'Pottery Firing Service in Berlin | Palavara',              description: 'Bring your greenware for bisque and glaze firing at Palavara Studio, Berlin. Reliable firing service at Steegerstr. 1A, 13359.' },
  { path: '/gift-certificate',         title: 'Pottery Gift Certificates in Berlin | Palavara',           description: 'Give the gift of pottery — certificates for wheel throwing, kids classes and more at Palavara Studio in Berlin.' },
  { path: '/team-events',              title: 'Pottery Team Events in Berlin | Palavara Studio',          description: 'Team-building pottery workshops in Berlin for companies and groups. Book a private session at Palavara Studio, Steegerstr. 1A.' },
  { path: '/birthday-parties',         title: 'Pottery Birthday Parties in Berlin | Palavara',            description: 'Host a pottery birthday party for kids or adults at Palavara Studio in Berlin. Creative, memorable events at Steegerstr. 1A.' },
  { path: '/membership',               title: 'Pottery Studio Membership in Berlin | Palavara',           description: 'Join Palavara Studio pottery membership in Berlin. Studio access, wheels, kilns and storage at Steegerstr. 1A, 13359.' },
  { path: '/about-me',                 title: 'About Varya — Palavara Pottery Studio Berlin',             description: 'Palavara is a ceramics studio founded by Varvara Polyakova in Berlin. Learn about the story, practice and community at Steegerstr. 1A.' },
  { path: '/rent-a-space',             title: 'Rent Pottery Studio Space in Berlin | Palavara',           description: 'Rent studio space for your pottery practice in Berlin. Wheels, kilns and workspace at Palavara, Steegerstr. 1A, 13359 Berlin.' },
  { path: '/contact',                  title: 'Contact Palavara Pottery Studio Berlin',                   description: 'Get in touch with Palavara Pottery Studio in Berlin. Email palavarastudio@gmail.com or visit Steegerstr. 1A, 13359 Berlin.' },
  { path: '/impressum',                title: 'Impressum | Palavara Pottery Studio',                      description: 'Impressum — legal notice for Palavara Pottery Studio, Steegerstr. 1A, 13359 Berlin.' },
  { path: '/agb',                      title: 'AGB | Palavara Pottery Studio Berlin',                     description: 'Allgemeine Geschäftsbedingungen (AGB) for Palavara Pottery Studio classes and services in Berlin.' },
  { path: '/datenschutzerklaerung',    title: 'Datenschutzerklärung | Palavara Pottery Studio',           description: 'Datenschutzerklärung — privacy policy for Palavara Pottery Studio Berlin.' },
];

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const buildDir = path.join(__dirname, '..', 'build');
const indexPath = path.join(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`ERROR: ${indexPath} not found. Did 'yarn build' run first?`);
  process.exit(1);
}
const indexHtml = fs.readFileSync(indexPath, 'utf8');

let count = 0;
for (const r of ROUTES) {
  if (r.path === '/') continue;

  const slug = r.path.replace(/^\//, '');
  const url = SITE_URL + r.path;
  const title = escapeText(r.title);
  const desc = escapeAttr(r.description);
  const titleAttr = escapeAttr(r.title);

  // Replace meta tags. Each pattern targets the home version we know is
  // in build/index.html — fail loudly if any pattern doesn't match,
  // since that means index.html shape changed and these substitutions
  // would silently produce a half-rewritten file.
  const replacements = [
    [/<title>[^<]*<\/title>/, `<title>${title}</title>`],
    [/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${desc}"/>`],
    [/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}"/>`],
    [/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${titleAttr}"/>`],
    [/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${desc}"/>`],
    [/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}"/>`],
    [/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${titleAttr}"/>`],
    [/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${desc}"/>`],
  ];

  let html = indexHtml;
  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(html)) {
      console.error(`ERROR: pattern ${pattern} did not match build/index.html — schema drift?`);
      process.exit(1);
    }
    html = html.replace(pattern, replacement);
  }

  const outPath = path.join(buildDir, `${slug}.html`);
  fs.writeFileSync(outPath, html);
  count++;
}

console.log(`✓ wrote ${count} per-route HTML files in build/`);
