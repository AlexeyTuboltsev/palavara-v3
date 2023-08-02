import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {TRoute} from "./router";

export enum EAppState {
  NOT_STARTED = "notStarted",
  IN_PROGRESS = "inProgress",
  READY = "ready",
  ERROR = "error",
}

export type TAppState =
  | TNotStartedAppState
  | TInProgressAppState
  | TReadyAppState
  | { appState: EAppState.ERROR, error: string }

export type TReadyAppState = {
  appState: EAppState.READY
  route: TRoute
}

export type TNotStartedAppState = { appState: EAppState.NOT_STARTED }
export type TInProgressAppState = { appState: EAppState.IN_PROGRESS }

function isReadyAppState(state: any): state is TReadyAppState {
  return state.appState === EAppState.READY
}

export const ui = createSlice({
  name: 'ui',
  initialState: {
    appState: EAppState.NOT_STARTED
  } as TAppState,
  reducers: {
    setRoute: (state, action: PayloadAction<TRoute>) => {
      if (isReadyAppState(state)) {
        state.route = action.payload
      }
    },
    setAppState: (state, action: PayloadAction<TAppState>) => {
      return action.payload
    }
  }
})

export const uiReducer = ui.reducer
export const {setRoute, setAppState} = ui.actions