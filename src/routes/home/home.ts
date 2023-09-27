import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";

export function home(): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.HOME},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME)
  }
}