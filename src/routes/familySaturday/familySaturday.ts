import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";
import {config} from "../../config";

export function* familySaturday(): Generator<any, void, any> {
  const imageUrlBase = "familySaturday"
  const imageLqipUrlBase = "lqip/familySaturday"
  const urls = [
    "01.jpg", "02.jpg", "03.jpg", "04.jpg", "05.jpg", "06.jpg"]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${imageUrlBase}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${imageLqipUrlBase}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.FAMILY_SATURDAY},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.FAMILY_SATURDAY),
    imageUrl: imageUrls[0],
    imageLqipUrl: imageLqipUrls[0]
  }

  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {...toggleMenuOpen,...imageChanger(imageUrls, imageLqipUrls)})
}

