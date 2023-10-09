import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";
import {config} from "../../config";
import {actions} from "../../actions";

export function* rentASpace(): Generator<any, void, any> {
  const urls = [
    "09-01.jpg",
    "09-02.jpg",
    "09-03.jpg",
  ]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${config.lqipPrefix}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.RENT_A_SPACE},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...toggleMenuOpen, ...imageChanger(imageUrls, imageLqipUrls)
  })
  yield put(actions.nextImage())

}