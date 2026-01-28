import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, screenResize, toggleMobileMenu, toggleSubmenu} from "../../sagas/uiSaga";
import {actions} from "../../actions";
import {TResizeEventPayload} from "../../services/resizeObserver";
import {EScreenSize, screenSize} from "../common/screenSize";
import {createImageState} from "../common/imageState";

export function* openStudio(screenDimensions: TResizeEventPayload): Generator<any, void, TReadyAppState> {
  const urls = [
    "08-01.jpg",
    "08-02.jpg",
    "08-03.jpg",
    "08-04.jpg",
    "08-05.jpg",
    "08-06.jpg",
  ]

  const s = screenSize(screenDimensions)
  const routeName = ERoute.OPEN_STUDIO

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
    ...imageChanger(urls, []),
    ...toggleMobileMenu
  })
  yield put(actions.nextImage())

}