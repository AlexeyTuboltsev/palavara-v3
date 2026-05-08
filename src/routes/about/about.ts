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
  // 05-01 is a class shot with the wrong subject for an "About Varya"
  // page; the alt text expects portraits and 05-02..05-10 are those.
  // Starting at 05-02 means the preload (set in public/index.html for
  // /about-me) hits the actual hero, not a frame the saga used to skip.
  const urls = [
    "05-02.jpg",
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
    ...createImageState(urls[0], urls.length)
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...screenResize,
    ...toggleSubmenu,
    ...imageChanger(urls),
    ...toggleMobileMenu
  })
}