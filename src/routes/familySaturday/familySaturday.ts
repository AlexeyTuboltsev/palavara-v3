import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function familySaturday(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.FAMILY_SATURDAY},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.FAMILY_SATURDAY)
  }
}