import {ERoute} from "../../router";
import {EAppState, TReadyAppState} from "../../types";
import {menu} from "../common/menu";
import {sectionMenu} from "../common/sectionMenu";
import {put, delay} from "redux-saga/effects";
import {setAppState} from "../../store";

export function* home(): Generator<any, void, TReadyAppState> {

  const urls = ['home-1.jpg', 'home-2.jpg', 'home-3.jpg', 'home-4.jpg', 'home-5.jpg', 'home-6.jpg', 'home-7.jpg']
  const state = {
    appState: EAppState.READY as const,
    route: {routeName: ERoute.HOME},
    sectionMenu: sectionMenu(),
    menu: menu(ERoute.HOME),
  }

  let i = 0
  // while (true) {
  //   yield put(setAppState({...state, url: urls[i]} as any))
  //
  //   i = (i === urls.length - 1) ? 0 : i + 1
  //
  //   yield delay(3000)
  // }

  yield put(setAppState({...state, url: urls[i]} as any))

}