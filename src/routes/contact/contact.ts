import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, toggleSubmenu} from "../../sagas/uiSaga";
import {TResizeEventPayload} from "../../services/resizeObserver";
import {screenSize} from "../common/screenSize";

export function* contact(screenDimensions: TResizeEventPayload): Generator<any, void, any> {

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.CONTACT},
    menuIsOpen: false,
    menuIsCollapsible:true,
    screenSize: screenSize(screenDimensions.devicePixelContentBoxSize),
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME),

  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, toggleSubmenu)
}