import {BrowserHistory} from "history";
import {call, put, spawn} from "redux-saga/effects";
import {EAppState, setAppState} from "../reducer";
import {TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";


export function* initSaga(dispatch: Dispatch) {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))
  const [history, unlisten]: [BrowserHistory, () => void] = yield call(setupHistory, dispatch)

  const route: TRoute = yield call(getRoute, window.location) //todo extract location to a service for testing etc

  yield spawn(locationWatcherSaga, history, route)
  yield put(setAppState({appState: EAppState.READY, route}))

  //todo unlisten
}