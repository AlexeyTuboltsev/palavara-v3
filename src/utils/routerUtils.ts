import {compile, Key, pathToRegexp} from "path-to-regexp";
import {BrowserHistory, createBrowserHistory} from "history";
import {ERoute, routeDefs, TRoute, TRouteDef} from "../router";
import {Dispatch} from "@reduxjs/toolkit";
import {actions} from "../actions";
import {ELang, i18n} from "../services/i18n";

// Per-language URL prefixes. EN is the default (no prefix); add a prefix
// here to expose another language under /<prefix>/<route>. The router
// strips the prefix before matching against routeDefs so the route list
// itself stays single-source.
const LANG_PREFIXES: Partial<Record<ELang, string>> = {
  [ELang.DE]: '/de',
};

export function parseLangFromPath(pathname: string): { lang: ELang; pathname: string } {
  for (const [lang, prefix] of Object.entries(LANG_PREFIXES)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      const stripped = pathname.slice(prefix!.length);
      return { lang: lang as ELang, pathname: stripped || '/' };
    }
  }
  return { lang: ELang.EN, pathname };
}

export function applyLangToPath(path: string, lang: ELang): string {
  const prefix = LANG_PREFIXES[lang];
  if (!prefix) return path;
  return path === '/' ? prefix : prefix + path;
}

export function getLangFromLocation(location: { pathname: string }): ELang {
  return parseLangFromPath(location.pathname).lang;
}

function compilePath(path: string, options: {}) {
  const keys: Key[] = [];
  const regexp = pathToRegexp(path, keys, options);
  return {regexp, keys};
}

export function matchRoute(route: string, pathname: string) {
  const {regexp, keys} = compilePath(route, {
    end: true,
    strict: false,
    sensitive: false
  });
  const match = regexp.exec(pathname);

  if (!match) return null;

  const [url, ...values] = match;
  const isExact = pathname === url;

  if (!isExact) return null;

  return {
    route,
    url: route === "/" && url === "" ? "/" : url,
    params: keys.reduce((memo: { [key: string]: string }, key: Key, index: number) => {
      memo[key.name] = values[index];
      return memo;
    }, {})
  };
}

function getRoutePattern(routes: TRouteDef[], route: TRoute) {
  return routes.find(r => r.routeName === route.routeName)
}

export function setLocation(history: BrowserHistory, routes: TRouteDef[], route: TRoute, lang?: ELang) {
  // NOT_FOUND keeps the browser URL as-is (no redirect) so the user sees the
  // path they typed while the app renders the 404 component.
  if (route.routeName === ERoute.NOT_FOUND) return

  const routeDef = getRoutePattern(routes, route)
  if (routeDef) {
    const toPath = compile(routeDef.routePattern, {encode: encodeURIComponent});

    const path = toPath((route as any).params || {})

    // Default to whatever language i18n currently has — the saga doesn't
    // always know lang explicitly, but at the moment setLocation runs,
    // i18n.changeLanguage has already been processed for any pending
    // switch, so this is the right source of truth.
    const effectiveLang = lang ?? (i18n.language as ELang) ?? ELang.EN;
    const fullPath = applyLangToPath(path, effectiveLang);

    if (fullPath !== window.location.pathname) {
      history.push(fullPath)
    }
  } else {
    throw Error("cannot create location")
  }
}

export function getRoute(location: {pathname:string}): TRoute {
  // Strip any language prefix (e.g. /de) before matching against routeDefs
  // — the route patterns themselves are language-agnostic.
  const { pathname } = parseLangFromPath(location.pathname);
  let routeMatch = null
  for (const routeDef of routeDefs) {
    const result = matchRoute(routeDef.routePattern, pathname)
    if (result) {
      routeMatch = {match: result, routeDef}
      break;
    }
  }

  if (!routeMatch) {
    return {routeName: ERoute.NOT_FOUND}
  } else {
    const parseResult = routeMatch.routeDef.paramsParser !== undefined
      ? routeMatch.routeDef.paramsParser(routeMatch.match.params)
      : {}

    return parseResult === null
      ? {routeName: ERoute.NOT_FOUND }
      : {routeName: routeMatch.routeDef.routeName, params: parseResult} as TRoute
  }
}

export function getRoutePath(route: TRoute): string {
  const routeDef = getRoutePattern(routeDefs, route)
  if (routeDef) {
    const toPath = compile(routeDef.routePattern, {encode: encodeURIComponent});
    return toPath((route as any).params || {})
  } else {
    throw Error("cannot create path for route")
  }
}

export function setupHistory(dispatch: Dispatch) {
  const history = createBrowserHistory()


  const unlisten = history.listen(({action, location}) => {
    if (action === "POP") {
      // Detect language change from URL (e.g. back-button from /de/... to /...)
      // and dispatch BEFORE the route change so the i18n state matches the
      // route by the time the route's component re-renders.
      const lang = getLangFromLocation(location)
      if (i18n.language !== lang) {
        dispatch(actions.changeLanguage(lang))
      }
      const route = getRoute(location) //todo getRoute has a fallback, here we need an explicit notFound
      dispatch(actions.requestRouteChange(route))
    }
  })
  return [history, unlisten]
}
