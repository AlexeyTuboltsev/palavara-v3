import {actions, EActionType, TAction} from "../actions";
import {call, cancel, fork, put, select, take} from "redux-saga/effects";
import {EMenuType, TMenuItem, TReadyAppState} from "../types";
import {generateRouteData} from "../routes/common/routeData";
import isEqual from "lodash.isequal";
import {Task} from "redux-saga";
import {produce} from "immer";
import {setAppState} from "../store";
import {requestSaga} from "./requestSaga";
import {EHttpMethod} from "../services/httpRequest";

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

export type TActionMap = { [key in EActionType]?: ((state: TReadyAppState, action: any) => TReadyAppState | Generator<any, TReadyAppState, any>) }

export const toggleMenuOpen: TActionMap = {
  [EActionType.TOGGLE_OPEN]: function* (state: TReadyAppState, action: ReturnType<typeof actions["toggleOpen"]>) {
    return yield put(setAppState(
      produce(state, (nextState: TReadyAppState) => {
        const menuItem: TMenuItem | undefined = nextState.menu[action.payload]

        if (menuItem && menuItem.type !== EMenuType.ROOT) {
          menuItem.isActive = !menuItem.isActive
        }
      })
    ))
  }
}

export const imageChanger = (urls: string[], lqipUrls: string[]): TActionMap => {
  return {
    [EActionType.NEXT_IMAGE]:
      function* (state: TReadyAppState, action: ReturnType<typeof actions.nextImage>) {
        const imageUrl = (state as any).imageUrl
        const i = urls.findIndex(url => imageUrl === url)

        if (i !== undefined) {
          const newImageUrl = urls[i + 1 <= urls.length - 1 ? i + 1 : 0];
          const newImageLqipUrl = lqipUrls[i + 1 <= urls.length - 1 ? i + 1 : 0];
          return yield call(loadImageWithLqip, state, newImageUrl, newImageLqipUrl)
        } else {
          return yield call(loadImageWithLqip, state, urls[0], lqipUrls[0])
        }
      },


    [EActionType.PREVIOUS_IMAGE]:
      function* (state: TReadyAppState, action: ReturnType<typeof actions.previousImage>) {
        const imageUrl = (state as any).imageUrl
        const i = urls.findIndex(url => imageUrl === url)
        if (i !== undefined) {
          const newImageUrl = urls[i > 0 ? i - 1 : urls.length - 1];
          const newImageLqipUrl = lqipUrls[i > 0 ? i - 1 : urls.length - 1]
          return yield call(loadImageWithLqip, state, newImageUrl, newImageLqipUrl)
        } else {
          return yield call(loadImageWithLqip, state, urls[urls.length - 1], lqipUrls[urls.length - 1])
        }
      },
  }
}

function* loadImageWithLqip(state: TReadyAppState, url: string, lqipUrl: string) {
  const lqip: Task<any> = yield fork(requestSaga, EHttpMethod.GET, lqipUrl, 'blob', actions.lqip)
  yield fork(requestSaga, EHttpMethod.GET, url, 'blob', actions.image)

  //img comes before lqip
  const imageOrLqip: {
    type: EActionType.LQIP | EActionType.IMG,
    payload: { data: string, status: string, statusText: string }
  } = yield take([actions.image.type, actions.lqip.type])

  if (imageOrLqip.type === EActionType.IMG) {
    yield cancel(lqip)
    const newState = produce(state, (nextState: TReadyAppState) => {
      (nextState as any).imageLqipUrl = lqipUrl;
      (nextState as any).imageUrl = url;

      (nextState as any).imageData = imageOrLqip.payload.data;
      (nextState as any).imageLqipData = null;
    })
    yield put(setAppState(newState))
  } else {
    // lqip comes before img
    yield put(setAppState(
      produce(state, (nextState: TReadyAppState) => {
        (nextState as any).imageLqipUrl = lqipUrl;
        (nextState as any).imageUrl = url;
        (nextState as any).imageLqipData = imageOrLqip.payload.data;
        (nextState as any).imageData = null;
      })
    ))

    const image: {
      payload: { data: string, status: string, statusText: string }
    } = yield take([actions.image.type, actions.image.type])

    const prevState:TReadyAppState = yield select(state => state.ui)

    yield put(setAppState(
      produce(state, (nextState: TReadyAppState) => {
        (nextState as any).imageLqipUrl = lqipUrl;
        (nextState as any).imageUrl = url;
        (nextState as any).imageLqipData = (prevState as any).imageLqipData;
        (nextState as any).imageData = image.payload.data;
      })
    ))
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
      yield call((actionMap as any)[stateGeneratorKey], state, action)
    }
  }
}
