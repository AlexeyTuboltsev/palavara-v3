import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";
import {config} from "../../config";

export function* membership(): Generator<any, void, any> {

  const imageLqipUrlBase = "lqip"
  const urls = ["07-01.jpg",]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${imageLqipUrlBase}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.MEMBERSHIP},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.MEMBERSHIP),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, toggleMenuOpen)
  yield fork(actionListenerLoop, {
    ...toggleMenuOpen, ...imageChanger(imageUrls, imageLqipUrls)
  })
}

