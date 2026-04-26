// All routes — single source of truth for paths, titles, descriptions,
// hero/section images, and image alts.

export type RouteKey =
  | 'home' | 'kidsClass' | 'wheelThrowing' | 'familySaturday'
  | 'openStudio' | 'firingService' | 'giftCertificate' | 'teamEvents'
  | 'birthdayParties' | 'membership' | 'about' | 'rentASpace'
  | 'contact' | 'impressum' | 'agb' | 'datenschutz' | 'notFound';

export interface RouteInfo {
  key: RouteKey;
  path: string;
  title: string;
  description: string;
  /** First image filename (without extension) — used for OG and hero. */
  heroBase?: string;
  /** Image filenames for cycling carousel on this route. */
  images?: string[];
  imageAlt?: string;
  noindex?: boolean;
}

export const ROUTES: Record<RouteKey, RouteInfo> = {
  home: {
    key: 'home', path: '/',
    title: 'Palavara — Pottery Classes & Ceramics Studio in Berlin',
    description: 'Learn pottery in Berlin at Palavara Studio. Wheel throwing, kids classes, open studio, memberships, team events and gift certificates at Steegerstr. 1A.',
    heroBase: 'home-1',
    images: ['home-1', 'home-2', 'home-3', 'home-4', 'home-5', 'home-6', 'home-7'],
    imageAlt: 'Palavara Pottery Studio Berlin — handmade ceramics',
  },
  kidsClass: {
    key: 'kidsClass', path: '/kids-class',
    title: 'Kids Pottery Classes in Berlin | Palavara Studio',
    description: 'Pottery classes for kids in Berlin at Palavara Studio. Creative, welcoming sessions at Steegerstr. 1A, 13359 Berlin.',
    heroBase: '02-01',
    images: ['02-01', '02-02', '02-03', '02-04', '02-05', '02-06', '02-07', '02-08', '02-09', '02-10', '02-11', '02-12', '02-13'],
    imageAlt: 'Kids pottery class at Palavara Studio Berlin',
  },
  wheelThrowing: {
    key: 'wheelThrowing', path: '/wheel-throwing',
    title: 'Wheel Throwing Classes in Berlin | Palavara',
    description: 'Learn wheel throwing in Berlin at Palavara Studio. Courses for beginners and returners at Steegerstr. 1A, 13359 Berlin.',
    heroBase: '04-01',
    images: ['04-01', '04-02', '04-03'],
    imageAlt: 'Wheel throwing pottery class at Palavara Studio Berlin',
  },
  familySaturday: {
    key: 'familySaturday', path: '/family-saturday',
    title: 'Family Pottery Saturdays in Berlin | Palavara',
    description: 'Family pottery workshops on Saturdays in Berlin. Make ceramics together with your kids at Palavara Studio, Steegerstr. 1A.',
    heroBase: '05-01',
    images: ['05-01', '05-02', '05-03', '05-04', '05-05', '05-06', '05-07', '05-08', '05-09', '05-10'],
    imageAlt: 'Family pottery workshop at Palavara Studio Berlin',
  },
  openStudio: {
    key: 'openStudio', path: '/open-studio',
    title: 'Open Studio Pottery Sessions in Berlin | Palavara',
    description: 'Drop in and work on your pottery at Palavara open studio in Berlin. Wheels, hand-building tools and firing available at Steegerstr. 1A.',
    heroBase: '06-01',
    images: ['06-01'],
    imageAlt: 'Open studio pottery session at Palavara Studio Berlin',
  },
  firingService: {
    key: 'firingService', path: '/firing-service',
    title: 'Pottery Firing Service in Berlin | Palavara',
    description: 'Bring your greenware for bisque and glaze firing at Palavara Studio, Berlin. Reliable firing service at Steegerstr. 1A, 13359.',
    heroBase: '07-01',
    images: ['07-01'],
    imageAlt: 'Pottery firing service at Palavara Studio Berlin',
  },
  giftCertificate: {
    key: 'giftCertificate', path: '/gift-certificate',
    title: 'Pottery Gift Certificates in Berlin | Palavara',
    description: 'Give the gift of pottery — certificates for wheel throwing, kids classes and more at Palavara Studio in Berlin.',
    heroBase: '08-01',
    images: ['08-01', '08-02', '08-03', '08-04', '08-05', '08-06'],
    imageAlt: 'Palavara pottery gift certificate Berlin',
  },
  teamEvents: {
    key: 'teamEvents', path: '/team-events',
    title: 'Pottery Team Events in Berlin | Palavara Studio',
    description: 'Team-building pottery workshops in Berlin for companies and groups. Book a private session at Palavara Studio, Steegerstr. 1A.',
    heroBase: '09-01',
    images: ['09-01', '09-02', '09-03'],
    imageAlt: 'Pottery team event at Palavara Studio Berlin',
  },
  birthdayParties: {
    key: 'birthdayParties', path: '/birthday-parties',
    title: 'Pottery Birthday Parties in Berlin | Palavara',
    description: 'Host a pottery birthday party for kids or adults at Palavara Studio in Berlin. Creative, memorable events at Steegerstr. 1A.',
    heroBase: '10-01',
    images: ['10-01'],
    imageAlt: 'Pottery birthday party at Palavara Studio Berlin',
  },
  membership: {
    key: 'membership', path: '/membership',
    title: 'Pottery Studio Membership in Berlin | Palavara',
    description: 'Join Palavara Studio pottery membership in Berlin. Studio access, wheels, kilns and storage at Steegerstr. 1A, 13359.',
    heroBase: '01-01',
    images: ['01-01', '01-02', '01-03', '01-04', '01-05', '01-06'],
    imageAlt: 'Palavara pottery studio membership Berlin',
  },
  about: {
    key: 'about', path: '/about-me',
    title: 'About Varya — Palavara Pottery Studio Berlin',
    description: 'Palavara is a ceramics studio founded by Varvara Polyakova in Berlin. Learn about the story, practice and community at Steegerstr. 1A.',
    heroBase: '2025-10-24-155119',
    images: ['2025-10-24-155119', '2025-10-24-155119_002', '2025-10-24-155119_003', '2025-10-24-155119_004'],
    imageAlt: 'Varvara Polyakova, founder of Palavara Pottery Studio Berlin',
  },
  rentASpace: {
    key: 'rentASpace', path: '/rent-a-space',
    title: 'Rent Pottery Studio Space in Berlin | Palavara',
    description: 'Rent studio space for your pottery practice in Berlin. Wheels, kilns and workspace at Palavara, Steegerstr. 1A, 13359 Berlin.',
    imageAlt: 'Palavara Pottery Studio space for rent in Berlin',
  },
  contact: {
    key: 'contact', path: '/contact',
    title: 'Contact Palavara Pottery Studio Berlin',
    description: 'Get in touch with Palavara Pottery Studio in Berlin. Email palavarastudio@gmail.com or visit Steegerstr. 1A, 13359 Berlin.',
    imageAlt: 'Palavara Pottery Studio at Steegerstr. 1A, Berlin',
  },
  impressum: {
    key: 'impressum', path: '/impressum',
    title: 'Impressum | Palavara Pottery Studio',
    description: 'Impressum — legal notice for Palavara Pottery Studio, Steegerstr. 1A, 13359 Berlin.',
  },
  agb: {
    key: 'agb', path: '/agb',
    title: 'AGB | Palavara Pottery Studio Berlin',
    description: 'Allgemeine Geschäftsbedingungen (AGB) for Palavara Pottery Studio classes and services in Berlin.',
  },
  datenschutz: {
    key: 'datenschutz', path: '/datenschutzerklaerung',
    title: 'Datenschutzerklärung | Palavara Pottery Studio',
    description: 'Datenschutzerklärung — privacy policy for Palavara Pottery Studio Berlin.',
  },
  notFound: {
    key: 'notFound', path: '/404',
    title: 'Page not found | Palavara Pottery Studio',
    description: 'The page you were looking for does not exist on the Palavara Pottery Studio site.',
    noindex: true,
  },
};

// Top-level navigation — used by the menu component.
export const NAV_GROUPS: Array<{label: string; children: RouteKey[]}> = [
  { label: 'classes', children: ['kidsClass', 'wheelThrowing'] },
  { label: 'family saturday', children: ['familySaturday'] },
  { label: 'open studio', children: ['openStudio'] },
  { label: 'firing service', children: ['firingService'] },
  { label: 'gift certificate', children: ['giftCertificate'] },
  { label: 'team events', children: ['teamEvents'] },
  { label: 'birthday parties', children: ['birthdayParties'] },
  { label: 'membership', children: ['membership'] },
  { label: 'rent a space', children: ['rentASpace'] },
  { label: 'about me', children: ['about'] },
  { label: 'contact', children: ['contact'] },
];
