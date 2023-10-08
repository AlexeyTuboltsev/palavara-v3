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
      case "EXTERNAL_LINK": {

      }
    }
  }
}

export type TActionMap = { [key in EActionType]?: (state: TReadyAppState, action: any) => TReadyAppState }

export const toggleMenuOpen: TActionMap = {
  [EActionType.TOGGLE_OPEN]: function (state: TReadyAppState, action: ReturnType<typeof actions["toggleOpen"]>) {
    return produce(state, (nextState: TReadyAppState) => {
      const menuItem: TMenuItem | undefined = nextState.menu[action.payload]

      if (menuItem && menuItem.type !== EMenuType.ROOT) {
        menuItem.isActive = !menuItem.isActive
      }
    })
  }
}

export const imageChanger = (urls: string[], lqipUrls:string[]): TActionMap => {
  return {
    [EActionType.NEXT_IMAGE]:
      (state: TReadyAppState, action: ReturnType<typeof actions["nextImage"]>) => {
        return produce(state, (nextState: TReadyAppState) => {
          const imageUrl = (state as any).imageUrl
          const i = urls.findIndex(url => imageUrl === url)
          if(i !== undefined){
            (nextState as any).imageUrl = urls[i + 1 <= urls.length - 1 ? i + 1 : 0];
            (nextState as any).imageLqipUrl = lqipUrls[i + 1 <= urls.length - 1 ? i + 1 : 0];
          } else {
            (nextState as any).imageUrl = urls[0];
            (nextState as any).imageLqipUrl = lqipUrls[0];
          }
        })
      },
    [EActionType.PREVIOUS_IMAGE]:
      (state: TReadyAppState, action: ReturnType<typeof actions["previousImage"]>) => {
        return produce(state, (nextState: TReadyAppState) => {
          const imageUrl = (state as any).imageUrl
          const i = urls.findIndex(url => imageUrl === url)
          if(i !== undefined){
            (nextState as any).imageUrl = urls[i > 0 ? i - 1 : urls.length - 1];
            (nextState as any).imageLqipUrl = lqipUrls[i > 0 ? i - 1 : urls.length - 1]
          } else {
            (nextState as any).imageUrl = urls[urls.length - 1];
            (nextState as any).imageLqipUrl = lqipUrls[urls.length - 1]
          }
        })
      },
  }
}


export function findStateGenerator(actionType: EActionType, actionMap: any) {
  return Object.keys(actionMap).find(key => key === actionType)
}

export function* actionListenerLoop(actionMap: TActionMap) {

  while (true) {
    const action: TAction = yield take(Object.keys(actionMap))

    const stateGeneratorKey: EActionType = yield call(findStateGenerator, action.type, actionMap)
    if (stateGeneratorKey !== undefined) {
      const state: Readonly<TReadyAppState> = yield select(state => state.ui)
      const nextUiState: TReadyAppState = yield call((actionMap as any)[stateGeneratorKey], state, action)
      yield put(setAppState(nextUiState))
    }
  }
}
