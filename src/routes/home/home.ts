import { ERoute } from "../../router";
import { EAppState, TReadyAppState } from "../../types";
import { menu } from "../common/menu";
import { sectionMenu } from "../common/sectionMenu";
import { all, delay, fork, put, select } from "redux-saga/effects";
import { setAppState } from "../../store";
import { actionListenerLoop, screenResize, toggleSubmenu } from "../../sagas/uiSaga";
import { config } from "../../config";
import { screenSize } from "../common/screenSize";
import { TResizeEventPayload } from "../../services/resizeObserver";

export function* home(screenDimensions: TResizeEventPayload): Generator<any, void, TReadyAppState> {
  const filenames = [
    'home-1.jpg',
    'home-2.jpg', 'home-3.jpg', 'home-4.jpg', 'home-5.jpg', 'home-6.jpg', 'home-7.jpg'
  ]
  const imageLqipUrls = filenames.map(url => `${config.imgPrefix}/lqip/${url}`)
  const legacyUrls = filenames.map(url => `${config.imgPrefix}/${url}`)
  const routeName = ERoute.HOME

  const initialState = {
    appState: EAppState.READY as const,
    route: { routeName: routeName },
    screenSize: screenSize(screenDimensions),
    menuIsOpen: true,
    menuIsCollapsible: false,
    sectionMenu: sectionMenu(routeName),
    menu: menu(routeName),
    currentImage: filenames[0],
    url: legacyUrls[0],
    lqipUrl: imageLqipUrls[0],
    totalImages: filenames.length,
  }
  yield put(setAppState(initialState))

  yield all([
    fork(cyclePictures, filenames, legacyUrls, imageLqipUrls),
    fork(actionListenerLoop,
      {
        ...screenResize,
        ...toggleSubmenu
      })
  ])

}

function* cyclePictures(filenames: string[], legacyUrls: string[], imageLqipUrls: string[]) {
  let i = 0

  while (true) {
    yield delay(5000)

    i = (i === filenames.length - 1) ? 0 : i + 1
    const state: Readonly<TReadyAppState> = yield select(state => state.ui)
    yield put(setAppState({
      ...state,
      currentImage: filenames[i],
      url: legacyUrls[i],
      lqipUrl: imageLqipUrls[i]
    } as any))
  }
}
