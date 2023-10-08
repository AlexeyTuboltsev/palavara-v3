import {routeDefs, TRoute} from "../router";
import {BrowserHistory} from "history";
import {call, select, take} from "redux-saga/effects";
import {PayloadAction} from "@reduxjs/toolkit";
import {setLocation} from "../utils/routerUtils";
import isEqual from 'lodash.isequal';
import {TReadyAppState} from "../types";
import {setAppState} from "../store";
import {actions} from "../actions";


export function* locationWatcherSaga(history: BrowserHistory, initialRoute: TRoute) {

  yield call(setLocation, history, routeDefs, initialRoute)
  while (true) {
    // const cancel = yield take() // TODO teardown
    const action: PayloadAction<TReadyAppState> | PayloadAction<string> = yield take([setAppState.type,actions.externalLink.type])

    if(action.type === setAppState.type){
      const newState = action.payload as TReadyAppState
      const route: TRoute = yield select(state => state.ui.route)

      if (!isEqual(newState.route, route)) {
        yield call(setLocation, history, routeDefs, newState.route)
      }
    }

    if(action.type === actions.externalLink.type){
      const link = action.payload as string
      history.push(link)
    }
  }
}