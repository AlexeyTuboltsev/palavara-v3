import {actions, EActionType, TAction} from "../actions";
import {call, cancel, fork, put, select, take} from "redux-saga/effects";
import {EMenuType, TMenuItem, TReadyAppState} from "../types";
import {generateRouteData} from "../routes/common/routeData";
import isEqual from "lodash.isequal";
import {Task} from "redux-saga";
import {produce} from "immer";
import {setAppState} from "../store";

export function* uiSaga() {
  let currentRouteDataGenerator: Task<any> | undefined = undefined;
  while (true) {
    const action: TAction = yield take(Object.values(actions).map(action => action.type))

    switch (action.type) {
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

export const toggleMenuOpen:{[key in EActionType]?:(state: TReadyAppState, action:any)=>TReadyAppState} = {
  [EActionType.TOGGLE_OPEN]: function (state: TReadyAppState, action: ReturnType<typeof actions["toggleOpen"]>) {
    return produce(state, (nextState: TReadyAppState) => {
      const menuItem: TMenuItem | undefined = nextState.menu[action.payload]

      if (menuItem && menuItem.type !== EMenuType.ROOT) {
        menuItem.isActive = !menuItem.isActive
      }
    })
  }
}


export function findStateGenerator(actionType: EActionType, actionMap: any) {
  return Object.keys(actionMap).find(key => key === actionType)
}

export function* actionListenerLoop(actionMap: { [key in EActionType]?:(state: TReadyAppState, action:any)=>TReadyAppState }) {

  while (true) {
    const action: TAction = yield take(Object.keys(actionMap))

    const stateGeneratorKey:EActionType = yield call(findStateGenerator, action.type, actionMap)
    if (stateGeneratorKey !== undefined) {
      const state: Readonly<TReadyAppState> = yield select(state => state.ui)
      const nextUiState:TReadyAppState = yield call((actionMap as any)[stateGeneratorKey], state, action)
      yield put(setAppState(nextUiState))
    }
  }
}
