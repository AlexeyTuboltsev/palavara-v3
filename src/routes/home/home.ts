import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {all, delay, fork, put, select} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, toggleMenuOpen} from "../../sagas/uiSaga";

export function* home(): Generator<any, void, TReadyAppState> {
  const urls = ['home-1.jpg', 'home-2.jpg', 'home-3.jpg', 'home-4.jpg', 'home-5.jpg', 'home-6.jpg', 'home-7.jpg']

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.HOME},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME),
    url: urls[0]
  }
  yield put(setAppState(initialState))

  yield all([
    fork(cyclePictures, urls),
    fork(actionListenerLoop, toggleMenuOpen)
  ])

}

function* cyclePictures(urls:string[]){
  let i = 1

  while(true){
    yield delay(3000)

    i = (i === urls.length - 1) ? 0 : i + 1
    const state: Readonly<TReadyAppState> = yield select(state => state.ui)
    yield put(setAppState({...state, url: urls[i]} as any))
  }
}
