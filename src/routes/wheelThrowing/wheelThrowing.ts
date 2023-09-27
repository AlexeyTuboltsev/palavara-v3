import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function wheelThrowing(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.WHEEL_THROWING},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.WHEEL_THROWING)
  }
}