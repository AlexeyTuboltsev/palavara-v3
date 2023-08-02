
export enum ERoute {
  HOME = "home",
  OTHER_ROUTE = 'otherRoute',
  ROUTE_TREE = 'routeTree',
}

export type TRouteDef = {
  routeName: ERoute,
  routePattern: string,
  paramsParser?: (params:{[key:string]:any}) => {[key:string]:string} | null //todo
}

export type TRoute =
  | ({ routeName: ERoute.HOME } & { params: {} })
  | ({ routeName: ERoute.OTHER_ROUTE } & { params: {} })
  | ({ routeName: ERoute.ROUTE_TREE } & { params: { id: string } })

export const routeDefs = [
  {routeName: ERoute.HOME, routePattern: '/'},
  {routeName: ERoute.OTHER_ROUTE, routePattern: '/asd'},
  {
    routeName: ERoute.ROUTE_TREE, routePattern: '/asd/:id', paramsParser: (params: {[key:string]:any}) => {
      if (params.id && typeof params.id === 'string') {
        return {id: params.id} as {id: string}
      } else {
        return null
      }
    }
  }
]

