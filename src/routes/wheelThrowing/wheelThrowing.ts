import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, toggleMenuOpen} from "../../sagas/uiSaga";

export function* wheelThrowing(): Generator<any, void, TReadyAppState> {
  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.WHEEL_THROWING},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.WHEEL_THROWING)
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, toggleMenuOpen)
}