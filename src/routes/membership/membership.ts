import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../reducer";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function membership(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.MEMBERSHIP},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.MEMBERSHIP)
  }
}