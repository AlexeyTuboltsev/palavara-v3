import {BrowserHistory} from "history";
import {call, fork, put, take} from "redux-saga/effects";
import {TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";
import {setupResizeObserver, TResizeEventPayload} from "../services/resizeObserver";
import {langWatcherSaga} from "./langWatcherSaga";
import {ELang, initI18n} from "../services/i18n";
import {uiSaga} from "./uiSaga";
import {loadImageManifest} from "./imageManifestLoader";
import {setAppState} from "../store";
import {EAppState} from "../types";
import {actions} from "../actions";
import {analyticsSaga} from "./analyticsSaga";
import {setupLinkClickListener} from "../services/analytics";


export function* initSaga(dispatch: Dispatch, rootElement: HTMLElement, i18n: any) {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [history, stopHistoryListener]: [BrowserHistory, () => void] = yield call(setupHistory, dispatch)
  const initialRoute: TRoute = yield call(getRoute, history.location) //todo extract location to a service for testing etc
  yield fork(locationWatcherSaga, history, initialRoute)
  yield fork(analyticsSaga, initialRoute)
  yield call(setupLinkClickListener)

  yield call(initI18n, i18n, ELang.EN)
  yield fork(langWatcherSaga, i18n)

  yield call(loadImageManifest);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stopResizeObserver: () => void = yield call(setupResizeObserver, rootElement, dispatch)
  const screenSize: { payload: TResizeEventPayload } = yield take(actions.screenResize)
  yield fork(uiSaga, screenSize.payload)
  yield put(actions.requestRouteChange(initialRoute))


  //TODO teardown (stopHistoryListener, stopResizeObserver, langWatcher)
}




