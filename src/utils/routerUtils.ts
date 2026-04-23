import {compile, Key, pathToRegexp} from "path-to-regexp";
import {BrowserHistory, createBrowserHistory} from "history";
import {ERoute, routeDefs, TRoute, TRouteDef} from "../router";
import {Dispatch} from "@reduxjs/toolkit";
import {actions} from "../actions";

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

export function setLocation(history: BrowserHistory, routes: TRouteDef[], route: TRoute) {
  // NOT_FOUND keeps the browser URL as-is (no redirect) so the user sees the
  // path they typed while the app renders the 404 component.
  if (route.routeName === ERoute.NOT_FOUND) return

  const routeDef = getRoutePattern(routes, route)
  if (routeDef) {
    const toPath = compile(routeDef.routePattern, {encode: encodeURIComponent});

    const path = toPath((route as any).params || {})

    if (path !== window.location.pathname) {
      history.push(path)
    }
  } else {
    throw Error("cannot create location")
  }
}

export function getRoute(location: {pathname:string}): TRoute {
  let routeMatch = null
  for (const routeDef of routeDefs) {
    const result = matchRoute(routeDef.routePattern, location.pathname)
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
      const route = getRoute(location) //todo getRoute has a fallback, here we need an explicit notFound
      dispatch(actions.requestRouteChange(route))
    }
  })
  return [history, unlisten]
}
