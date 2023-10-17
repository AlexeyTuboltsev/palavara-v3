import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {all, delay, fork, put, select} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, toggleSubmenu} from "../../sagas/uiSaga";
import {config} from "../../config";
import {screenSize} from "../common/screenSize";
import {TResizeEventPayload} from "../../services/resizeObserver";

export function* home(screenDimensions: TResizeEventPayload): Generator<any, void, TReadyAppState> {
  const urls = [
    'home-1.jpg',
    'home-2.jpg', 'home-3.jpg', 'home-4.jpg', 'home-5.jpg', 'home-6.jpg', 'home-7.jpg'
  ]
  const imageLqipUrlBase = "lqip"
  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`)
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${imageLqipUrlBase}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.HOME},
    screenSize: screenSize(screenDimensions.devicePixelContentBoxSize),
    menuIsOpen:true,
    menuIsCollapsible: false,
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME),
    url: imageUrls[0],
    lqipUrl: imageLqipUrls[0],
  }
  yield put(setAppState(initialState))

  yield all([
    // fork(cyclePictures, imageUrls,imageLqipUrls),
    fork(actionListenerLoop, toggleSubmenu)
  ])

}

function* cyclePictures(imageUrls:string[],imageLqipUrls:string[]){
  let i = 0

  while(true){
    yield delay(3000)

    i = (i === imageUrls.length - 1) ? 0 : i + 1
    const state: Readonly<TReadyAppState> = yield select(state => state.ui)
    yield put(setAppState({...state, url: imageUrls[i], lqipUrl: imageLqipUrls[i]} as any))
  }
}
