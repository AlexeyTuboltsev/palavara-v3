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

export function* about(screenDimensions: TResizeEventPayload): Generator<any, void, any> {
  const urls = [
    "05-01.jpg",
    "05-02.jpg",
    "05-03.jpg",
    "05-04.jpg",
    "05-05.jpg",
    "05-06.jpg",
    "05-07.jpg",
    "05-08.jpg",
    "05-09.jpg",
    "05-10.jpg",
  ]

  const displayType = screenSize(screenDimensions)
  const routeName = ERoute.ABOUT

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: routeName},
    screenSize: displayType,
    menuIsOpen: displayType !== EScreenSize.MOBILE,
    menuIsCollapsible:true,
    sectionMenu: sectionMenu(routeName),
    menu: menu(routeName),
    ...createImageState(urls[0])
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...screenResize,
    ...toggleSubmenu,
    ...imageChanger(urls),
    ...toggleMobileMenu
  })

  yield put(actions.nextImage())
}