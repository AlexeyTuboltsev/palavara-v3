import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {put} from "redux-saga/effects";
import {setAppState} from "../../store";

export function* wheelThrowing(): Generator<any, void, TReadyAppState> {

  const state = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.WHEEL_THROWING},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.WHEEL_THROWING)
  }
  yield put(setAppState(state))
  return
}