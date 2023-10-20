import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMobileMenu, toggleSubmenu} from "../../sagas/uiSaga";
import {config} from "../../config";
import {actions} from "../../actions";
import {TResizeEventPayload} from "../../services/resizeObserver";
import {EScreenSize, screenSize} from "../common/screenSize";

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

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${config.lqipPrefix}/${url}`)
  const displayType = screenSize(screenDimensions.devicePixelContentBoxSize)
  const routeName = ERoute.ABOUT

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: routeName},
    screenSize: displayType,
    menuIsOpen: displayType !== EScreenSize.MOBILE,
    menuIsCollapsible:true,
    sectionMenu: sectionMenu(routeName),
    menu: menu(routeName),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...toggleSubmenu, ...imageChanger(imageUrls, imageLqipUrls),...toggleMobileMenu
  })

  yield put(actions.nextImage())
}