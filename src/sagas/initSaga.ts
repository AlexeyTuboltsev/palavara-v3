import {BrowserHistory} from "history";
import {call, fork, put} from "redux-saga/effects";
import {EAppState, EMenuType, setAppState} from "../reducer";
import {TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";
import {setupResizeObserver} from "../services/resizeObserver";
import {langWatcherSaga} from "./langWatcherSaga";
import {ELang, initI18n} from "../services/i18n";
import {generateRandomString} from "../utils/utils";

export function* initSaga(dispatch: Dispatch, rootElement: HTMLElement, i18n:any) {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))

  const [history, stopHistoryListener]: [BrowserHistory, () => void] = yield call(setupHistory, dispatch)
  const initialRoute: TRoute = yield call(getRoute, history.location) //todo extract location to a service for testing etc
  yield fork(locationWatcherSaga, history, initialRoute)

  yield call(initI18n, i18n, ELang.EN)
  yield fork(langWatcherSaga, i18n)

  const stopResizeObserver: () => void = yield call(setupResizeObserver, rootElement, dispatch)

  yield put(setAppState({
    appState: EAppState.READY,
    route: initialRoute,
    sectionMenu : [
      {id: generateRandomString(3),label: 'about', isActive: false},
      {id: generateRandomString(3),label: 'shop', isActive: false},
      {id: generateRandomString(3),label: 'rent a space', isActive: false},
      {id: generateRandomString(3),label: 'contact', isActive: false},
    ],
    menu: [
      {
        id: generateRandomString(3), type: EMenuType.PARENT, label: 'classes', isActive: false, children: [
          {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'kids class', isActive: false},
          {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'whieel-throwing', isActive: false},
        ]
      },
      {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'family saturday', isActive: false},
      {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'open studio', isActive: false},
      {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'firing service', isActive: false},
      {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'gift certificate', isActive: false},
      {id: generateRandomString(3),type: EMenuType.SIMPLE, label: 'membership', isActive: false},
    ]
  }))

  //TODO teardown (stopHistoryListener, stopResizeObserver, langWatcher)
}

