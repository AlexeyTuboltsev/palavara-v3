import {createAction} from '@reduxjs/toolkit'
import {TResizeEventPayload} from "./services/resizeObserver";
import {ELang} from "./services/i18n";

function withPayloadType<T>() {
  return (t: T) => ({payload: t})
}

enum EActionType {
  INIT_STARTED = 'INIT_STARTED',
  INIT_ERROR = "INIT_ERROR",
  INIT_DONE = "INIT_DONE",
  SCREEN_RESIZE = 'SCREEN_RESIZE',
  CHANGE_LANGUAGE = 'CHANGE_LANGUAGE'
}

export const actions = {
  initStarted: createAction(EActionType.INIT_STARTED),
  initError: createAction(EActionType.INIT_ERROR, withPayloadType<{ errorMessage: string }>()),
  initDone: createAction(EActionType.INIT_DONE),


  screenResize: createAction(EActionType.SCREEN_RESIZE, withPayloadType<TResizeEventPayload>()),
  changeLanguage: createAction(EActionType.CHANGE_LANGUAGE, withPayloadType<ELang>())
}
