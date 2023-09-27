import {actions, TAction} from "../actions";
import {call, put, select, take} from "redux-saga/effects";
import {EMenuType, TMenuItem, TReadyAppState} from "../types";
import {produce} from "immer";
import {generateRouteData} from "../routes/common/routeData";
import {setAppState} from "../store";

export function* uiSaga() {
  while (true) {
    const action: TAction = yield take(Object.values(actions).map(action => action.type))

    const state:Readonly<TReadyAppState> = yield select(state => state.ui)
    switch (action.type) {
      case "TOGGLE_OPEN": {
        const nextUiState:TReadyAppState = yield call(produce as any, state, (nextState:TReadyAppState) => {
          const menuItem: TMenuItem | undefined = nextState.menu[action.payload]

          if (menuItem && menuItem.type !== EMenuType.ROOT) {
            menuItem.isActive = !menuItem.isActive
          }
        })

        yield put(setAppState(nextUiState))
        break;
      }
      case "REQUEST_ROUTE_CHANGE": {
        const route = action.payload
        const nextUiState:TReadyAppState = yield call(generateRouteData, route)

        yield put(setAppState(nextUiState))
        break;
      }
    }
  }
}