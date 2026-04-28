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
const STUDIO_ID = `${SITE_URL}/#studio`; // matches the LocalBusiness @id in index.html
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/home-1.jpg`;
const CDN = 'https://be.palavara.com/img/studio';

// Per-route metadata. Mirrors src/services/seo.ts pageMeta plus a few
// extra fields used to emit per-route JSON-LD:
//   - schemaType: 'Service' | 'Course' | 'Person' | null
//   - serviceType: free-text label, e.g. 'Pottery class'
//   - hero: filename on the CDN (no extension) for the JSON-LD image
//   - alternateName: German equivalent — helps multilingual ranking
const ROUTES = [
  // Home is excluded from the prerender loop (it's index.html). Listed for symmetry.
  { path: '/',                       title: 'Palavara — Pottery Classes & Ceramics Studio in Berlin', description: 'Learn pottery in Berlin at Palavara Studio. Wheel throwing, kids classes, open studio, memberships, team events and gift certificates at Steegerstr. 1A.', hero: 'home-1', schemaType: null },

  { path: '/kids-class',             title: 'Kids Pottery Classes in Berlin | Palavara Studio',       description: 'Pottery classes for kids in Berlin at Palavara Studio. Creative, welcoming sessions at Steegerstr. 1A, 13359 Berlin.',                                hero: '02-01', schemaType: 'Course',  serviceType: 'Pottery class', alternateName: 'Töpferkurse für Kinder in Berlin' },
  { path: '/wheel-throwing',         title: 'Wheel Throwing Classes in Berlin | Palavara',            description: 'Learn wheel throwing in Berlin at Palavara Studio. Courses for beginners and returners at Steegerstr. 1A, 13359 Berlin.',                              hero: '04-01', schemaType: 'Course',  serviceType: 'Pottery class', alternateName: 'Töpferkurs an der Drehscheibe in Berlin' },
  { path: '/family-saturday',        title: 'Family Pottery Saturdays in Berlin | Palavara',          description: 'Family pottery workshops on Saturdays in Berlin. Make ceramics together with your kids at Palavara Studio, Steegerstr. 1A.',                            hero: '01-01', schemaType: 'Course',  serviceType: 'Pottery class', alternateName: 'Familien-Töpfern am Samstag in Berlin' },
  { path: '/open-studio',            title: 'Open Studio Pottery Sessions in Berlin | Palavara',      description: 'Drop in and work on your pottery at Palavara open studio in Berlin. Wheels, hand-building tools and firing available at Steegerstr. 1A.',               hero: '08-01', schemaType: 'Service', serviceType: 'Open pottery studio', alternateName: 'Offenes Töpferatelier in Berlin' },
  { path: '/firing-service',         title: 'Pottery Firing Service in Berlin | Palavara',            description: 'Bring your greenware for bisque and glaze firing at Palavara Studio, Berlin. Reliable firing service at Steegerstr. 1A, 13359.',                       hero: '06-01', schemaType: 'Service', serviceType: 'Pottery firing service', alternateName: 'Brennservice für Keramik in Berlin' },
  { path: '/gift-certificate',       title: 'Pottery Gift Certificates in Berlin | Palavara',         description: 'Give the gift of pottery — certificates for wheel throwing, kids classes and more at Palavara Studio in Berlin.',                                       hero: '10-01', schemaType: 'Service', serviceType: 'Gift certificate', alternateName: 'Gutschein für Töpferkurs in Berlin' },
  { path: '/team-events',            title: 'Pottery Team Events in Berlin | Palavara Studio',        description: 'Team-building pottery workshops in Berlin for companies and groups. Book a private session at Palavara Studio, Steegerstr. 1A.',                          hero: '2025-10-24-155119_002', schemaType: 'Service', serviceType: 'Team-building workshop', alternateName: 'Töpfer-Teamevents in Berlin' },
  { path: '/birthday-parties',       title: 'Pottery Birthday Parties in Berlin | Palavara',          description: 'Host a pottery birthday party for kids or adults at Palavara Studio in Berlin. Creative, memorable events at Steegerstr. 1A.',                          hero: '2025-10-24-155119_002', schemaType: 'Service', serviceType: 'Birthday party workshop', alternateName: 'Geburtstag mit Töpfern in Berlin' },
  { path: '/membership',             title: 'Pottery Studio Membership in Berlin | Palavara',         description: 'Join Palavara Studio pottery membership in Berlin. Studio access, wheels, kilns and storage at Steegerstr. 1A, 13359.',                                 hero: '07-01', schemaType: 'Service', serviceType: 'Pottery studio membership', alternateName: 'Töpferstudio Mitgliedschaft in Berlin' },
  { path: '/about-me',               title: 'About Varya — Palavara Pottery Studio Berlin',           description: 'Palavara is a ceramics studio founded by Varvara Polyakova in Berlin. Learn about the story, practice and community at Steegerstr. 1A.',                hero: '05-01', schemaType: 'Person' },
  { path: '/rent-a-space',           title: 'Rent Pottery Studio Space in Berlin | Palavara',         description: 'Rent studio space for your pottery practice in Berlin. Wheels, kilns and workspace at Palavara, Steegerstr. 1A, 13359 Berlin.',                          hero: '09-01', schemaType: 'Service', serviceType: 'Pottery studio rental', alternateName: 'Töpferatelier mieten in Berlin' },
  { path: '/contact',                title: 'Contact Palavara Pottery Studio Berlin',                 description: 'Get in touch with Palavara Pottery Studio in Berlin. Email palavarastudio@gmail.com or visit Steegerstr. 1A, 13359 Berlin.',                            hero: 'home-1', schemaType: null },

  { path: '/impressum',              title: 'Impressum | Palavara Pottery Studio',                    description: 'Impressum — legal notice for Palavara Pottery Studio, Steegerstr. 1A, 13359 Berlin.',                                                                  hero: 'home-1', schemaType: null },
  { path: '/agb',                    title: 'AGB | Palavara Pottery Studio Berlin',                   description: 'Allgemeine Geschäftsbedingungen (AGB) for Palavara Pottery Studio classes and services in Berlin.',                                                    hero: 'home-1', schemaType: null },
  { path: '/datenschutzerklaerung',  title: 'Datenschutzerklärung | Palavara Pottery Studio',         description: 'Datenschutzerklärung — privacy policy for Palavara Pottery Studio Berlin.',                                                                          hero: 'home-1', schemaType: null },
];

function buildJsonLd(route, url) {
  if (!route.schemaType) return null;
  const image = route.hero ? `${CDN}/${route.hero}.jpg` : DEFAULT_OG_IMAGE;
  const nameNoBrand = route.title.replace(/\s*\|.*$/, '').replace(/\s*—\s*Palavara.*$/i, '').trim();

  if (route.schemaType === 'Service') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: nameNoBrand,
      ...(route.alternateName ? { alternateName: route.alternateName } : {}),
      description: route.description,
      serviceType: route.serviceType,
      provider: { '@id': STUDIO_ID },
      areaServed: { '@type': 'City', name: 'Berlin' },
      url,
      image,
      inLanguage: ['en', 'de'],
    };
  }
  if (route.schemaType === 'Course') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: nameNoBrand,
      ...(route.alternateName ? { alternateName: route.alternateName } : {}),
      description: route.description,
      provider: { '@id': STUDIO_ID },
      url,
      image,
      inLanguage: ['en', 'de'],
      educationalCredentialAwarded: 'Pottery experience',
      hasCourseInstance: [{
        '@type': 'CourseInstance',
        courseMode: 'in-person',
        location: { '@id': STUDIO_ID },
        inLanguage: ['en', 'de'],
      }],
    };
  }
  if (route.schemaType === 'Person') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Varvara Polyakova',
      jobTitle: 'Founder, Palavara Pottery Studio',
      worksFor: { '@id': STUDIO_ID },
      url,
      image,
    };
  }
  return null;
}

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

  // Per-route JSON-LD. Inserted just before </head> as a separate
  // <script>; sits alongside the LocalBusiness schema that's already
  // in index.html. Multiple JSON-LD blocks on one page are valid and
  // Google reads them all.
  const ld = buildJsonLd(r, url);
  if (ld) {
    const tag = `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
    if (!html.includes('</head>')) {
      console.error('ERROR: no </head> tag found in build/index.html');
      process.exit(1);
    }
    html = html.replace('</head>', `${tag}</head>`);
  }

  const outPath = path.join(buildDir, `${slug}.html`);
  fs.writeFileSync(outPath, html);
  count++;
}

console.log(`✓ wrote ${count} per-route HTML files in build/`);
