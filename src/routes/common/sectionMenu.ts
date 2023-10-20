import {generateRandomString} from "../../utils/utils";
import {actions} from "../../actions";
import {ERoute} from "../../router";
import {ESectionMenuDisplayType, TSectionMenuItem} from "../../types";

export function sectionMenu(routeName: ERoute):TSectionMenuItem[]{
  return [
    {id: generateRandomString(3),mobileDisplayType:ESectionMenuDisplayType.MAIN, label: 'about', isActive: routeName === ERoute.ABOUT, action: actions.requestRouteChange({routeName:ERoute.ABOUT})},
    {id: generateRandomString(3),mobileDisplayType:ESectionMenuDisplayType.MAIN, label: 'shop', isActive: false, action: actions.externalLink("https://www.etsy.com/shop/PALAVARA")},
    {id: generateRandomString(3),mobileDisplayType:ESectionMenuDisplayType.SECONDARY, label: 'rent a space', isActive:routeName === ERoute.RENT_A_SPACE, action: actions.requestRouteChange({routeName:ERoute.RENT_A_SPACE})},
    {id: generateRandomString(3),mobileDisplayType:ESectionMenuDisplayType.SECONDARY, label: 'contact', isActive: routeName === ERoute.CONTACT, action: actions.requestRouteChange({routeName:ERoute.CONTACT})},
  ]
}