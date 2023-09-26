import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../reducer";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function openStudio(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.OPEN_STUDIO},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.OPEN_STUDIO)
  }
}