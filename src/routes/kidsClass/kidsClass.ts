import {ERoute} from "../../router";
import {EAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {fork, put} from "redux-saga/effects";
import {setAppState} from "../../store";
import {actionListenerLoop, imageChanger, toggleMenuOpen} from "../../sagas/uiSaga";
import {config} from "../../config";
import {actions} from "../../actions";

export function* kidsClass(): Generator<any, void, any> {
  const urls = [
    "02-01.jpg", "02-02.jpg", "02-03.jpg", "02-04.jpg", "02-05.jpg", "02-06.jpg", "02-07.jpg", "02-08.jpg", "02-09.jpg", "02-10.jpg", "02-11.jpg",
    "02-12.jpg", "02-13.jpg"]

  const imageUrls = urls.map(url => `${config.imgPrefix}/${url}`);
  const imageLqipUrls = urls.map(url => `${config.imgPrefix}/${config.lqipPrefix}/${url}`)

  const initialState = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.KIDS_CLASS},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.KIDS_CLASS),
    imageUrl: null,
    imageLqipUrl: null
  }
  yield put(setAppState(initialState))

  yield fork(actionListenerLoop, {
    ...toggleMenuOpen, ...imageChanger(imageUrls, imageLqipUrls)
  })
  yield put(actions.nextImage())
}