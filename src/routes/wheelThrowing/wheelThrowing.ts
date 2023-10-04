import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";

export function* wheelThrowing(): Generator<any, void, TReadyAppState> {
  const imageUrlBase = "wheelThrowing"
  const imageLqipUrlBase = "wheelThrowing/lr"
  const urls = ["01.jpg"]

  const imageUrls = urls.map(url => `img/${imageUrlBase}/${url}`);
  const imageLqipUrls = urls.map(url => `img/${imageLqipUrlBase}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.WHEEL_THROWING},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.WHEEL_THROWING),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {...toggleMenuOpen,...imageChanger(imageUrls, imageLqipUrls)})
}