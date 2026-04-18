import {ERoute, routeDefs, TRoute} from "../router";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const routeTitles: Record<ERoute, string> = {
  [ERoute.HOME]: 'Home',
  [ERoute.KIDS_CLASS]: 'Kids Class',
  [ERoute.WHEEL_THROWING]: 'Wheel Throwing',
  [ERoute.FAMILY_SATURDAY]: 'Family Saturday',
  [ERoute.OPEN_STUDIO]: 'Open Studio',
  [ERoute.FIRING_SERVICE]: 'Firing Service',
  [ERoute.GIFT_CERTIFICATE]: 'Gift Certificate',
  [ERoute.TEAM_EVENTS]: 'Team Events',
  [ERoute.BIRTHDAY_PARTIES]: 'Birthday Parties',
  [ERoute.MEMBERSHIP]: 'Membership',
  [ERoute.ABOUT]: 'About',
  [ERoute.RENT_A_SPACE]: 'Rent a Space',
  [ERoute.CONTACT]: 'Contact',
  [ERoute.IMPRESSUM]: 'Impressum',
  [ERoute.AGB]: 'AGB',
  [ERoute.DATENSCHUTZ]: 'Datenschutz',
};

function gtag(...args: any[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export function trackEvent(name: string, params: Record<string, any> = {}) {
  gtag('event', name, params);
}

export function trackPageView(route: TRoute) {
  const def = routeDefs.find(r => r.routeName === route.routeName);
  const path = def?.routePattern ?? window.location.pathname;
  const title = routeTitles[route.routeName] ?? route.routeName;
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.origin + path,
  });
}

export function trackLanguageChange(language: string) {
  trackEvent('language_change', {language});
}

export function trackEmailClick(email: string) {
  trackEvent('email_click', {email});
}

export function trackOutboundLink(url: string, label: string) {
  trackEvent('outbound_click', {url, label});
}

export function setupLinkClickListener(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handler = (e: MouseEvent) => {
    const anchor = (e.target as HTMLElement | null)?.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;

    if (href.startsWith('mailto:')) {
      trackEmailClick(href.replace(/^mailto:/, ''));
      return;
    }

    if (/^https?:\/\//i.test(href)) {
      try {
        const url = new URL(href);
        if (url.host !== window.location.host) {
          trackOutboundLink(href, anchor.textContent?.trim() || '');
        }
      } catch {
        // malformed URL — skip
      }
    }
  };

  document.addEventListener('click', handler, {capture: true});
  return () => document.removeEventListener('click', handler, {capture: true});
}
