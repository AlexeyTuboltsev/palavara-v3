import {TRoute} from "../router";
import {setRoute} from "../reducer";
import {BrowserHistory} from "history";
import {take, call} from "redux-saga/effects";
import {PayloadAction} from "@reduxjs/toolkit";
import {setLocation} from "../utils/routerUtils";
import {routeDefs} from "../router";

export function* locationWatcherSaga(history: BrowserHistory, initialRoute: TRoute) {

  yield call(setLocation, history, routeDefs, initialRoute)
  while (true) {
    // const cancel = yield take() // TODO teardown
    const routeAction: PayloadAction<TRoute> = yield take([setRoute.type])
    yield call(setLocation,  history, routeDefs,routeAction.payload)
  }
}