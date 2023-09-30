import {BrowserHistory} from "history";
import {call, fork, put} from "redux-saga/effects";
import {TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";
import {setupResizeObserver} from "../services/resizeObserver";
import {langWatcherSaga} from "./langWatcherSaga";
import {ELang, initI18n} from "../services/i18n";
import {uiSaga} from "./uiSaga";
import {setAppState} from "../store";
import {EAppState} from "../types";
import {actions} from "../actions";


export function* initSaga(dispatch: Dispatch, rootElement: HTMLElement, i18n: any) {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))

  const [history, stopHistoryListener]: [BrowserHistory, () => void] = yield call(setupHistory, dispatch)
  const initialRoute: TRoute = yield call(getRoute, history.location) //todo extract location to a service for testing etc
  yield fork(locationWatcherSaga, history, initialRoute)

  yield call(initI18n, i18n, ELang.EN)
  yield fork(langWatcherSaga, i18n)

  const stopResizeObserver: () => void = yield call(setupResizeObserver, rootElement, dispatch)

  yield fork(uiSaga)
  yield put(actions.requestRouteChange(initialRoute))


  //TODO teardown (stopHistoryListener, stopResizeObserver, langWatcher)
}




