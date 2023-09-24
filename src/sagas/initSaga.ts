import {BrowserHistory} from "history";
import {call, fork, put, select, take} from "redux-saga/effects";
import {EAppState, EMenuType, setAppState, TMenuItem, TReadyAppState} from "../reducer";
import {ERoute, TRoute} from "../router";
import {locationWatcherSaga} from "./locationWatcherSaga";
import {getRoute, setupHistory} from "../utils/routerUtils";
import {Dispatch} from "@reduxjs/toolkit";
import {setupResizeObserver} from "../services/resizeObserver";
import {langWatcherSaga} from "./langWatcherSaga";
import {ELang, initI18n} from "../services/i18n";
import {generateRandomString} from "../utils/utils";
import {actions, TAction} from "../actions";
import {produce} from 'immer';

const menu: { root: TMenuItem } & { [id: string]: TMenuItem } = {
  root: {
    id: 'root',
    type: EMenuType.ROOT as const,
    children: ['classes', 'familySaturday', 'openStudio', 'firingService', 'giftCertificate', 'membership']
  },
  'classes': {
    id: 'classes',
    type: EMenuType.PARENT as const,
    label: 'classes',
    isActive: false,
    children: ['kidsClass', 'wheelThrowing'],
    action: actions.toggleOpen('classes')
  },
  'familySaturday': {
    id: 'familySaturday',
    type: EMenuType.SIMPLE,
    label: 'family saturday',
    isActive: false,
    action: actions.requestRouteChange({routeName: ERoute.FAMILY_SATURDAY})
  },
  'openStudio': {
    id: 'openStudio',
    type: EMenuType.SIMPLE,
    label: 'open studio',
    isActive: false,
    action: actions.requestRouteChange({routeName: ERoute.OPEN_STUDIO})
  },
  'firingService': {
    id: 'firingService',
    type: EMenuType.SIMPLE,
    label: 'firing service',
    isActive: false,
    action: actions.requestRouteChange({routeName: ERoute.FIRING_SERVICE})
  },
  'giftCertificate': {
    id: 'giftCertificate',
    type: EMenuType.SIMPLE,
    label: 'gift certificate',
    isActive: false,
    action: actions.requestRouteChange({routeName: ERoute.GIFT_CERTIFICATE})
  },
  'membership': {
    id: "membership",
    type: EMenuType.SIMPLE,
    label: 'membership',
    isActive: false,
    action: actions.requestRouteChange({routeName: ERoute.MEMBERSHIP})
  },

  'kidsClass': {
    id: 'kidsClass',
    type: EMenuType.SIMPLE,
    label: 'kids class',
    isActive: false,
    action: actions.requestRouteChange({
      routeName: ERoute.KIDS_CLASS
    })
  },
  'wheelThrowing': {
    id: 'wheelThrowing',
    type: EMenuType.SIMPLE,
    label: 'wheel-throwing',
    isActive: false,
    action: actions.requestRouteChange({routeName: ERoute.WHEEL_THROWING})
  },
}

function initialReadyUiState(initialRoute: TRoute): TReadyAppState {

  return {
    appState: EAppState.READY as const,
    route: initialRoute,
    sectionMenu:
      [
        {id: generateRandomString(3), label: 'about', isActive: false, action: actions.noop()},
        {id: generateRandomString(3), label: 'shop', isActive: false, action: actions.noop()},
        {id: generateRandomString(3), label: 'rent a space', isActive: false, action: actions.noop()},
        {id: generateRandomString(3), label: 'contact', isActive: false, action: actions.noop()},
      ],
    menu
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


  yield put(setAppState(initialReadyUiState(initialRoute)))

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
    }

  }
}