import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, screenResize, toggleMobileMenu, toggleSubmenu} from "../../sagas/uiSaga";
import {config} from "../../config";
import {actions} from "../../actions";
import {TResizeEventPayload} from "../../services/resizeObserver";
import {EScreenSize, screenSize} from "../common/screenSize";

export function* workshops(screenDimensions: TResizeEventPayload): Generator<any, void, TReadyAppState> {
  const urls = ["ws.jpg"]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${config.lqipPrefix}/${url}`)
  const s = screenSize(screenDimensions)
  const routeName = ERoute.WORKSHOPS

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: routeName},
    screenSize: s,
    menuIsOpen: s !== EScreenSize.MOBILE,
    menuIsCollapsible:true,
    sectionMenu: sectionMenu(routeName),
    menu: menu(routeName),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...screenResize,
    ...toggleSubmenu,
    ...imageChanger(imageUrls, imageLqipUrls), 
    ...toggleMobileMenu
  })
  yield put(actions.nextImage())
}