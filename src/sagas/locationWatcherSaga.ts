import {routeDefs, TRoute} from "../router";
import {setAppState, TReadyAppState} from "../reducer";
import {BrowserHistory} from "history";
import {call, select, take} from "redux-saga/effects";
import {PayloadAction} from "@reduxjs/toolkit";
import {setLocation} from "../utils/routerUtils";
import isEqual from 'lodash.isequal';

export function* locationWatcherSaga(history: BrowserHistory, initialRoute: TRoute) {

  yield call(setLocation, history, routeDefs, initialRoute)
  while (true) {
    // const cancel = yield take() // TODO teardown
    const route: TRoute = yield select(state => state.ui.route)
    const {payload: newState}: PayloadAction<TReadyAppState> = yield take([setAppState.type])
    if (isEqual(newState.route, route)) {
      yield call(setLocation, history, routeDefs, newState.route)
    }
  }
}