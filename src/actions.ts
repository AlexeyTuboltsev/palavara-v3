import {createAction} from '@reduxjs/toolkit'
import {TResizeEventPayload} from "./services/resizeObserver";
import {ELang} from "./services/i18n";
import {TRoute} from "./router";

function withPayloadType<T>() {
  return (t: T) => ({payload: t})
}

export enum EActionType {
  INIT_STARTED = 'INIT_STARTED',
  INIT_ERROR = "INIT_ERROR",
  INIT_DONE = "INIT_DONE",
  SCREEN_RESIZE = 'SCREEN_RESIZE',
  CHANGE_LANGUAGE = 'CHANGE_LANGUAGE',
  REQUEST_ROUTE_CHANGE = 'REQUEST_ROUTE_CHANGE',
  NOOP = "NOOP",
  TOGGLE_OPEN = "TOGGLE_OPEN"
}

export type TAction = ReturnType<typeof actions[keyof typeof actions]>

export const actions = {
  noop: createAction(EActionType.NOOP),
  initStarted: createAction(EActionType.INIT_STARTED),
  initError: createAction(EActionType.INIT_ERROR, withPayloadType<{ errorMessage: string }>()),
  initDone: createAction(EActionType.INIT_DONE),


  screenResize: createAction(EActionType.SCREEN_RESIZE, withPayloadType<TResizeEventPayload>()),
  changeLanguage: createAction(EActionType.CHANGE_LANGUAGE, withPayloadType<ELang>()),
  requestRouteChange: createAction(EActionType.REQUEST_ROUTE_CHANGE, withPayloadType<TRoute>()),
  toggleOpen: createAction(EActionType.TOGGLE_OPEN, withPayloadType<string>())
}

