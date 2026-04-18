import {select, take} from "redux-saga/effects";
import {PayloadAction} from "@reduxjs/toolkit";
import isEqual from 'lodash.isequal';
import {setAppState} from "../store";
import {actions} from "../actions";
import {TRoute} from "../router";
import {trackLanguageChange, trackPageView} from "../services/analytics";

export function* analyticsSaga(initialRoute: TRoute) {
  // initial page_view already fired by gtag('config') in index.html
  let lastRoute: TRoute = initialRoute;
  while (true) {
    const action: PayloadAction<any> = yield take([setAppState.type, actions.changeLanguage.type]);

    if (action.type === setAppState.type) {
      const route: TRoute = yield select(state => state.ui.route);
      if (route && !isEqual(route, lastRoute)) {
        lastRoute = route;
        trackPageView(route);
      }
    } else if (action.type === actions.changeLanguage.type) {
      trackLanguageChange(action.payload as string);
    }
  }
}
