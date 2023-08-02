import {pathToRegexp, Key, compile} from "path-to-regexp";
import {BrowserHistory, createBrowserHistory} from "history";
import {ERoute, routeDefs, TRoute, TRouteDef} from "../router";
import {setRoute} from "../reducer";
import { Dispatch } from "@reduxjs/toolkit";

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

function getRoutePattern(routes:TRouteDef[], route: TRoute) {
  return routes.find(r => r.routeName === route.routeName)
}

export function setLocation(history: BrowserHistory, routes:TRouteDef[], route: TRoute) {
  const routeDef = getRoutePattern(routes, route)
  if (routeDef) {
    const toPath = compile(routeDef.routePattern, { encode: encodeURIComponent });
    const path = toPath(route.params)

    if (path !== window.location.pathname) {
      history.push(path)
    }
  } else {
    throw Error("cannot create location")
  }
}

export function getRoute(location: Location): TRoute {
  let routeMatch = null
  for (const routeObject of routeDefs) {
    const result = matchRoute(routeObject.routePattern, location.pathname)
    console.log("result", result)
    if (result) {
      routeMatch = {match: result, route: routeObject}
      break;
    }
  }

  if (!routeMatch) {
    return {routeName: ERoute.HOME, params: {}}
  } else {
    const parseResult = routeMatch.route.paramsParser
      ? routeMatch.route.paramsParser(routeMatch.match.params)
      : {}

    return parseResult === null
      ? { routeName: ERoute.HOME , params: {} }
      : { routeName: routeMatch.route.routeName, params: parseResult} as TRoute
  }
}

export function setupHistory(dispatch: Dispatch) {
  const history = createBrowserHistory()


  const unlisten = history.listen(({action, location}) => {
    if (action === "POP") {
      const route = getRoute(location as any) //todo getRoute has a fallback, here we need an explicit notFound
      dispatch(setRoute(route))
    }
  })
  return [history, unlisten]
}