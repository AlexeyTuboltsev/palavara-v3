import {generateRandomString} from "../../utils/utils";
import {actions} from "../../actions";
import {ERoute} from "../../router";

export function sectionMenu(){
  return [
    {id: generateRandomString(3), label: 'about', isActive: false, action: actions.requestRouteChange({routeName:ERoute.ABOUT})},
    {id: generateRandomString(3), label: 'shop', isActive: false, action: actions.externalLink("https://www.etsy.com/shop/PALAVARA")},
    {id: generateRandomString(3), label: 'rent a space', isActive: false, action: actions.requestRouteChange({routeName:ERoute.RENT_A_SPACE})},
    {id: generateRandomString(3), label: 'contact', isActive: false, action: actions.requestRouteChange({routeName:ERoute.CONTACT})},
  ]
}