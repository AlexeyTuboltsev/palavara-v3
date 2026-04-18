import {ERoute, routeDefs} from "../router";

export type TPageMeta = {
  title: string;
  description: string;
};

const SITE_URL = 'https://studio.palavara.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/img/home-1.jpg`;

export const pageMeta: Record<ERoute, TPageMeta> = {
  [ERoute.HOME]: {
    title: 'Palavara — Pottery Classes & Ceramics Studio in Berlin',
    description: 'Learn pottery in Berlin at Palavara Studio. Wheel throwing, kids classes, open studio, memberships, team events and gift certificates at Steegerstr. 1A.',
  },
  [ERoute.KIDS_CLASS]: {
    title: 'Kids Pottery Classes in Berlin | Palavara Studio',
    description: 'Pottery classes for kids in Berlin at Palavara Studio. Creative, welcoming sessions at Steegerstr. 1A, 13359 Berlin.',
  },
  [ERoute.WHEEL_THROWING]: {
    title: 'Wheel Throwing Classes in Berlin | Palavara',
    description: 'Learn wheel throwing in Berlin at Palavara Studio. Courses for beginners and returners at Steegerstr. 1A, 13359 Berlin.',
  },
  [ERoute.FAMILY_SATURDAY]: {
    title: 'Family Pottery Saturdays in Berlin | Palavara',
    description: 'Family pottery workshops on Saturdays in Berlin. Make ceramics together with your kids at Palavara Studio, Steegerstr. 1A.',
  },
  [ERoute.OPEN_STUDIO]: {
    title: 'Open Studio Pottery Sessions in Berlin | Palavara',
    description: 'Drop in and work on your pottery at Palavara open studio in Berlin. Wheels, hand-building tools and firing available at Steegerstr. 1A.',
  },
  [ERoute.FIRING_SERVICE]: {
    title: 'Pottery Firing Service in Berlin | Palavara',
    description: 'Bring your greenware for bisque and glaze firing at Palavara Studio, Berlin. Reliable firing service at Steegerstr. 1A, 13359.',
  },
  [ERoute.GIFT_CERTIFICATE]: {
    title: 'Pottery Gift Certificates in Berlin | Palavara',
    description: 'Give the gift of pottery — certificates for wheel throwing, kids classes and more at Palavara Studio in Berlin.',
  },
  [ERoute.TEAM_EVENTS]: {
    title: 'Pottery Team Events in Berlin | Palavara Studio',
    description: 'Team-building pottery workshops in Berlin for companies and groups. Book a private session at Palavara Studio, Steegerstr. 1A.',
  },
  [ERoute.BIRTHDAY_PARTIES]: {
    title: 'Pottery Birthday Parties in Berlin | Palavara',
    description: 'Host a pottery birthday party for kids or adults at Palavara Studio in Berlin. Creative, memorable events at Steegerstr. 1A.',
  },
  [ERoute.MEMBERSHIP]: {
    title: 'Pottery Studio Membership in Berlin | Palavara',
    description: 'Join Palavara Studio pottery membership in Berlin. Studio access, wheels, kilns and storage at Steegerstr. 1A, 13359.',
  },
  [ERoute.ABOUT]: {
    title: 'About Varya — Palavara Pottery Studio Berlin',
    description: 'Palavara is a ceramics studio founded by Varvara Polyakova in Berlin. Learn about the story, practice and community at Steegerstr. 1A.',
  },
  [ERoute.RENT_A_SPACE]: {
    title: 'Rent Pottery Studio Space in Berlin | Palavara',
    description: 'Rent studio space for your pottery practice in Berlin. Wheels, kilns and workspace at Palavara, Steegerstr. 1A, 13359 Berlin.',
  },
  [ERoute.CONTACT]: {
    title: 'Contact Palavara Pottery Studio Berlin',
    description: 'Get in touch with Palavara Pottery Studio in Berlin. Email palavarastudio@gmail.com or visit Steegerstr. 1A, 13359 Berlin.',
  },
  [ERoute.IMPRESSUM]: {
    title: 'Impressum | Palavara Pottery Studio',
    description: 'Impressum — legal notice for Palavara Pottery Studio, Steegerstr. 1A, 13359 Berlin.',
  },
  [ERoute.AGB]: {
    title: 'AGB | Palavara Pottery Studio Berlin',
    description: 'Allgemeine Geschäftsbedingungen (AGB) for Palavara Pottery Studio classes and services in Berlin.',
  },
  [ERoute.DATENSCHUTZ]: {
    title: 'Datenschutzerklärung | Palavara Pottery Studio',
    description: 'Datenschutzerklärung — privacy policy for Palavara Pottery Studio Berlin.',
  },
};

export function getCanonicalUrl(routeName: ERoute): string {
  const def = routeDefs.find(r => r.routeName === routeName);
  const path = def?.routePattern ?? '/';
  return `${SITE_URL}${path === '/' ? '' : path}${path === '/' ? '/' : ''}`;
}

export function getOgImage(): string {
  return DEFAULT_OG_IMAGE;
}
