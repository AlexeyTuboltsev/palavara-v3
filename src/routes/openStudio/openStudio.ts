import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {put} from "redux-saga/effects";
import {setAppState} from "../../store";

export function* openStudio(): Generator<any, void, TReadyAppState> {

  const state = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.OPEN_STUDIO},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.OPEN_STUDIO)
  }
  yield put(setAppState(state))
  return;
}