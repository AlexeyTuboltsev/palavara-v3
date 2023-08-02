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

  const initialRoute: TRoute = yield call(getRoute, history.location) //todo extract location to a service for testing etc

  yield spawn(locationWatcherSaga, history, initialRoute)
  yield put(setAppState({appState: EAppState.READY, route: initialRoute}))

  //TODO teardown (unlisten)
}