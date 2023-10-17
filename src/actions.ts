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
  TOGGLE_SUBMENU = "TOGGLE_SUBMENU",
  NEXT_IMAGE = 'NEXT_IMAGE',
  PREVIOUS_IMAGE = 'PREVIOUS_IMAGE',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  IMG = 'IMG',
  LQIP = 'LQIP',
  TOGLLE_MOBILE_MENU = 'TOGLLE_MOBILE_MENU'
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
  toggleOpen: createAction(EActionType.TOGGLE_SUBMENU, withPayloadType<string>()),
  nextImage: createAction(EActionType.NEXT_IMAGE),
  previousImage: createAction(EActionType.PREVIOUS_IMAGE),
  externalLink: createAction(EActionType.EXTERNAL_LINK, withPayloadType<string>()),
  image: createAction(EActionType.IMG, withPayloadType<{data:string, status:number, statusText:string}>()),
  lqip: createAction(EActionType.LQIP, withPayloadType<{data:string, status:number, statusText:string}>()),
  toggleMobileMenu: createAction(EActionType.TOGLLE_MOBILE_MENU)
}

