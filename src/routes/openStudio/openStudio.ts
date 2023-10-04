import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";

export function* openStudio(): Generator<any, void, TReadyAppState> {
  const imageUrlBase = "openStudio"
  const imageLqipUrlBase = "openStudio/lr"
  const urls = ["01.jpg"]

  const imageUrls = urls.map(url => `img/${imageUrlBase}/${url}`);
  const imageLqipUrls = urls.map(url => `img/${imageLqipUrlBase}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.OPEN_STUDIO},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.OPEN_STUDIO),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {...toggleMenuOpen,...imageChanger(imageUrls, imageLqipUrls)})
}