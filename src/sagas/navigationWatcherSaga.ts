import {delay, put, select, take} from "redux-saga/effects";
import {PayloadAction} from "@reduxjs/toolkit";
import isEqual from 'lodash.isequal';
import {actions} from "../actions";
import {endNavigation, setAppState, startNavigation} from "../store";
import {TRoute} from "../router";

// 250ms matches the BlurOverlay CSS transition; keep the overlay up long enough
// to finish its fade-in even on near-instant cached-chunk navigations.
const MIN_VISIBLE_MS = 250;

export function* navigationWatcherSaga() {
  while (true) {
    const req: PayloadAction<TRoute> = yield take(actions.requestRouteChange.type);
    const currentRoute: TRoute | undefined = yield select(state => state.ui.route);
    const targetRoute = req.payload;

    if (currentRoute && isEqual(currentRoute, targetRoute)) {
      continue; // same route, no overlay
    }

    const startedAt = Date.now();
    yield put(startNavigation());

    // Wait for setAppState carrying the new route.
    yield take((action: any) =>
      action.type === setAppState.type &&
      action.payload?.route &&
      !isEqual(action.payload.route, currentRoute)
    );

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_VISIBLE_MS) {
      yield delay(MIN_VISIBLE_MS - elapsed);
    }

    yield put(endNavigation());
  }
}
