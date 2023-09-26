import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../reducer";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function firingService(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.FIRING_SERVICE},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.FIRING_SERVICE)
  }
}