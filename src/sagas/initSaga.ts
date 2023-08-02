import {BrowserHistory} from "history";
import {call, fork, put} from "redux-saga/effects";
import {EAppState, setAppState} from "../reducer";
import {TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";
import {setupResizeObserver} from "../services/resizeObserver";

export function* initSaga(dispatch: Dispatch, rootElement: HTMLElement) {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))
  const [history, stopHistoryListener]: [BrowserHistory, () => void] = yield call(setupHistory, dispatch)
  const stopResizeObserver: () => void = yield call(setupResizeObserver, rootElement, dispatch)

  const initialRoute: TRoute = yield call(getRoute, history.location) //todo extract location to a service for testing etc

  yield fork(locationWatcherSaga, history, initialRoute)
  yield put(setAppState({appState: EAppState.READY, route: initialRoute}))

  //TODO teardown (unlisten)
}