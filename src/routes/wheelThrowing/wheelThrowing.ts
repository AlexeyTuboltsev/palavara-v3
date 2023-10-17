import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMobileMenu, toggleSubmenu} from "../../sagas/uiSaga";
import {config} from "../../config";
import {actions} from "../../actions";
import {TResizeEventPayload} from "../../services/resizeObserver";
import {screenSize} from "../common/screenSize";

export function* wheelThrowing(screenDimensions: TResizeEventPayload): Generator<any, void, TReadyAppState> {
  const urls = ["04-01.jpg","04-02.jpg","04-03.jpg"]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${config.lqipPrefix}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.WHEEL_THROWING},
    screenSize: screenSize(screenDimensions.devicePixelContentBoxSize),
    menuIsOpen:false,
    menuIsCollapsible:true,
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.WHEEL_THROWING),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {...toggleSubmenu,...imageChanger(imageUrls, imageLqipUrls), ...toggleMobileMenu})
  yield put(actions.nextImage())
}