import {createAction} from '@reduxjs/toolkit'

function withPayloadType<T>() {
  return (t: T) => ({payload: t})
}

enum EActionType {
  INIT_STARTED = 'INIT_STARTED',
  INIT_ERROR = "INIT_ERROR",
  INIT_DONE = "INIT_DONE",
}

export const actions = {
  initStarted: createAction(EActionType.INIT_STARTED),
  initError: createAction(EActionType.INIT_ERROR, withPayloadType<{ errorMessage: string }>()),

  initDone: createAction(EActionType.INIT_DONE)

}
