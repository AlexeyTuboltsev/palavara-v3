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

export function* kidsClass(screenDimensions: TResizeEventPayload): Generator<any, void, any> {
  const urls = [
    "02-01.jpg", "02-02.jpg", "02-03.jpg", "02-04.jpg", "02-05.jpg", "02-06.jpg", "02-07.jpg", "02-08.jpg", "02-09.jpg", "02-10.jpg", "02-11.jpg",
    "02-12.jpg", "02-13.jpg"]

  const s = screenSize(screenDimensions)
  const routeName = ERoute.KIDS_CLASS

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