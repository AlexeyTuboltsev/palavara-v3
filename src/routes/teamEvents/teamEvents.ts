import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, screenResize, toggleMobileMenu, toggleSubmenu} from "../../sagas/uiSaga";
import {actions} from "../../actions";
import {TResizeEventPayload} from "../../services/resizeObserver";
import {EScreenSize, screenSize} from "../common/screenSize";
import {createImageState} from "../common/imageState";

export function* teamEvents(screenDimensions: TResizeEventPayload): Generator<any, void, any> {
  const urls = [
    "2025-10-24-155119_002.jpg",
    "2025-10-24-155119_003.jpg",
    "2025-10-24-155119_004.jpg",
  ]

  const s = screenSize(screenDimensions)
  const routeName = ERoute.TEAM_EVENTS

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: routeName},
    screenSize: s,
    menuIsOpen: s !== EScreenSize.MOBILE,
    menuIsCollapsible:true,
    sectionMenu: sectionMenu(routeName),
    menu: menu(routeName),
    ...createImageState(urls[0])
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...screenResize,
    ...toggleSubmenu,
    ...toggleMobileMenu,
    ...imageChanger(urls, [])
  })
  yield put(actions.nextImage())
}