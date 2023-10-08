import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, toggleMenuOpen} from "../../sagas/uiSaga";

export function* contact(): Generator<any, void, any> {

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.CONTACT},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME),

  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, toggleMenuOpen)
}