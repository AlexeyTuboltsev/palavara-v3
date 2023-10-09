import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";
import {config} from "../../config";
import {actions} from "../../actions";

export function* familySaturday(): Generator<any, void, any> {
  const urls = [
    "01-01.jpg", "01-02.jpg", "01-03.jpg", "01-04.jpg", "01-05.jpg", "01-06.jpg"]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${config.lqipPrefix}/${url}`)

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
  yield put(actions.nextImage())
}

