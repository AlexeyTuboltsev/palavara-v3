
export enum ERoute {
  HOME = "home",
  KIDS_CLASS = "kidsClass",
  WHEEL_THROWING = "wheelThrowing",
  WORKSHOPS = "workshops",
  FAMILY_SATURDAY = "familySaturday",
  OPEN_STUDIO = "openStudio",
  FIRING_SERVICE = "firingService",
  GIFT_CERTIFICATE = "giftCertificate",
  MEMBERSHIP = "membership",
  ABOUT = "about",
  RENT_A_SPACE = "rentASpace",
  CONTACT = "contact",
}

export type TRouteDef = {
  routeName: ERoute,
  routePattern: string,
  paramsParser?: ((params:{[key:string]:any}) => {[key:string]:string} | null) //todo
}

export type TRoute =
  | ({ routeName: ERoute.HOME } )
  | ({ routeName: ERoute.KIDS_CLASS} )
  | ({ routeName: ERoute.WHEEL_THROWING } )
  | ({ routeName: ERoute.FAMILY_SATURDAY } )
  | ({ routeName: ERoute.OPEN_STUDIO } )
  | ({ routeName: ERoute.FIRING_SERVICE } )
  | ({ routeName: ERoute.GIFT_CERTIFICATE } )
  | ({ routeName: ERoute.MEMBERSHIP } )
  | ({ routeName: ERoute.ABOUT } )
  | ({ routeName: ERoute.RENT_A_SPACE } )
  | ({ routeName: ERoute.CONTACT } )
  | ({ routeName: ERoute.WORKSHOPS } )

export const routeDefs:TRouteDef[] = [
  {routeName: ERoute.HOME, routePattern: '/'},
  {routeName: ERoute.KIDS_CLASS, routePattern: '/kids-class'},
  {routeName: ERoute.WHEEL_THROWING, routePattern: '/wheel-throwing'},
  {routeName: ERoute.FAMILY_SATURDAY, routePattern: '/family-saturday'},
  {routeName: ERoute.OPEN_STUDIO, routePattern: '/open-studio'},
  {routeName: ERoute.FIRING_SERVICE, routePattern: '/firing-service'},
  {routeName: ERoute.GIFT_CERTIFICATE, routePattern: '/gift-certificate'},
  {routeName: ERoute.MEMBERSHIP, routePattern: '/membership'},
  {routeName: ERoute.ABOUT, routePattern: '/about-me'},
  {routeName: ERoute.RENT_A_SPACE, routePattern: '/rent-a-space'},
  {routeName: ERoute.CONTACT, routePattern: '/contact'},
  {routeName: ERoute.WORKSHOPS, routePattern: '/workshops'},

  // {
  //   routeName: ERoute.ROUTE_TREE, routePattern: '/asd/:id', paramsParser: (params: {[key:string]:any}) => {
  //     if (params.id && typeof params.id === 'string') {
  //       return {id: params.id} as {id: string}
  //     } else {
  //       return null
  //     }
  //   }
  // }
]

