import {createBrowserHistory} from "history";
import {put, spawn, call} from "redux-saga/effects";
import {EAppState, setAppState} from "../reducer";
import {TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getInitialRoute} from "../utils/routerUtils";

export function* initSaga() {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))
  const history = createBrowserHistory()
  const route: TRoute = yield call(getInitialRoute, window.location) //todo extract location to a service for testing etc

  yield spawn(locationWatcherSaga, history, route)
  yield put(setAppState({appState: EAppState.READY, route}))
}