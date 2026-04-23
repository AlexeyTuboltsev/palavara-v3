import { ERoute } from "../../router";
import { EAppState } from "../../types";
import { menu } from "../common/menu";
import { sectionMenu } from "../common/sectionMenu";
import { fork, put } from "redux-saga/effects";
import { setAppState } from "../../store";
import { actionListenerLoop, screenResize, toggleMobileMenu, toggleSubmenu } from "../../sagas/uiSaga";
import { TResizeEventPayload } from "../../services/resizeObserver";
import { EScreenSize, screenSize } from "../common/screenSize";

export function* notFound(screenDimensions: TResizeEventPayload): Generator<any, void, any> {
  const s = screenSize(screenDimensions)
  const routeName = ERoute.NOT_FOUND

  const initialState = {
    appState: EAppState.READY as const,
    route: { routeName: routeName },
    menuIsCollapsible: true,
    screenSize: s,
    menuIsOpen: s !== EScreenSize.MOBILE,
    sectionMenu: sectionMenu(ERoute.HOME),
    menu: menu(ERoute.HOME),
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...screenResize,
    ...toggleSubmenu,
    ...toggleMobileMenu
  })
}
