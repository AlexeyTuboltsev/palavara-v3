import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../reducer";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function kidsClass(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.KIDS_CLASS},
    sectionMenu: sectionMenu(),
    menu:menu( ERoute.KIDS_CLASS)
  }
}