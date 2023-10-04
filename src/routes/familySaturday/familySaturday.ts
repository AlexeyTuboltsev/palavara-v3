import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, toggleMenuOpen} from "../../sagas/uiSaga";

export function* familySaturday(): Generator<any, void, any> {
  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.FAMILY_SATURDAY},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.FAMILY_SATURDAY)
  }

  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, toggleMenuOpen)
}

