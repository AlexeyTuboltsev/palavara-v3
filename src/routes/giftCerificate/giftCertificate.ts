import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function giftCertificate(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.GIFT_CERTIFICATE},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.GIFT_CERTIFICATE)
  }
}