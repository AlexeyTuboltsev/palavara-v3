import {BrowserHistory} from "history";
import {call, fork, put, select, take} from "redux-saga/effects";
import {EAppState, EMenuType, setAppState, setRoute, TMenuItem, TReadyAppState} from "../reducer";
import {ERoute, TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";
import {setupResizeObserver} from "../services/resizeObserver";
import {langWatcherSaga} from "./langWatcherSaga";
import {ELang, initI18n} from "../services/i18n";
import {actions, TAction} from "../actions";
import {produce} from 'immer';
import {home} from "./home";
import {kidsClass} from "./kidsClass";


function generateRouteData(route: TRoute): TReadyAppState {

  switch (route.routeName){
    case ERoute.HOME:
      return home();
    case ERoute.KIDS_CLASS:
      return kidsClass()
    case ERoute.FAMILY_SATURDAY:
    case ERoute.FIRING_SERVICE:
    case ERoute.GIFT_CERTIFICATE:
    case ERoute.MEMBERSHIP:
    case ERoute.OPEN_STUDIO:
    case ERoute.WHEEL_THROWING:
      return home()
  }

}

export function* initSaga(dispatch: Dispatch, rootElement: HTMLElement, i18n: any) {
  yield put(setAppState({appState: EAppState.IN_PROGRESS}))

  const [history, stopHistoryListener]: [BrowserHistory, () => void] = yield call(setupHistory, dispatch)
  const initialRoute: TRoute = yield call(getRoute, history.location) //todo extract location to a service for testing etc
  yield fork(locationWatcherSaga, history, initialRoute)

  yield call(initI18n, i18n, ELang.EN)
  yield fork(langWatcherSaga, i18n)

  const stopResizeObserver: () => void = yield call(setupResizeObserver, rootElement, dispatch)


  yield put(setAppState(generateRouteData(initialRoute)))

  //TODO teardown (stopHistoryListener, stopResizeObserver, langWatcher)
  yield fork(uiSaga)

}


function* uiSaga() {
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

        yield put(setRoute(nextUiState.route))
        yield put(setAppState(nextUiState))
        break;
      }
    }
  }
}

