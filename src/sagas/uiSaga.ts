import {actions, TAction} from "../actions";
import {call, fork, put, select, take, cancel} from "redux-saga/effects";
import {EMenuType, TMenuItem, TReadyAppState} from "../types";
import {produce} from "immer";
import {generateRouteData} from "../routes/common/routeData";
import {setAppState} from "../store";
import isEqual from "lodash.isequal";
import {Task} from "redux-saga";

export function* uiSaga() {
  let currentRouteDataGenerator: Task<any> | undefined = undefined;
  while (true) {
    const action: TAction = yield take(Object.values(actions).map(action => action.type))

    const state: Readonly<TReadyAppState> = yield select(state => state.ui)
    switch (action.type) {
      case "TOGGLE_OPEN": {
        const nextUiState: TReadyAppState = yield call(produce as any, state, (nextState: TReadyAppState) => {
          const menuItem: TMenuItem | undefined = nextState.menu[action.payload]

          if (menuItem && menuItem.type !== EMenuType.ROOT) {
            menuItem.isActive = !menuItem.isActive
          }
        })

        yield put(setAppState(nextUiState))
        break;
      }
      case "REQUEST_ROUTE_CHANGE": {
        const state: Readonly<TReadyAppState> = yield select(state => state.ui)

        const route = action.payload
        if (!isEqual(state.route, route)) {
          if (currentRouteDataGenerator !== undefined) {
            yield cancel(currentRouteDataGenerator);
          }
          const routeDataGenerator = generateRouteData(route)
          currentRouteDataGenerator = yield fork(routeDataGenerator as any)
        }

        break;
      }
    }
  }
}