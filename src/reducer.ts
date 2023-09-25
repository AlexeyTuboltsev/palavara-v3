import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {TRoute} from "./router";
import {actions, TAction} from "./actions";
import exp from "constants";

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
  | TErrorAppState

export type TReadyAppState = {
  appState: EAppState.READY
  route: TRoute,
  sectionMenu: TSectionMenuItem[],
  menu: { root: TMenuItem } & { [id: string]: TMenuItem }
}

export enum EMenuType {
  SIMPLE = "simple",
  PARENT = "parent",
  CHILD = "child",
  ROOT = 'root'
}

export type TSectionMenuItem = { id: string, label: string, isActive: boolean, action: TAction }

type TMenuItemCommonProps = {
  id: string,
  label: string,
  isActive: boolean,
  action: TAction
}
export type TRootMenuItem = { id: 'root', type: EMenuType.ROOT, children: string[] }
export type TParentMenuItem = { type: EMenuType.PARENT, children: string[] } & TMenuItemCommonProps
export type TChildMenuItem = { type: EMenuType.CHILD, children: string[] } & TMenuItemCommonProps
export type TSimpleMenuItem = { type: EMenuType.SIMPLE } & TMenuItemCommonProps
export type TMenuItem =
  | TRootMenuItem
  | TChildMenuItem
  | TParentMenuItem
  | TSimpleMenuItem

export type TNotStartedAppState = { appState: EAppState.NOT_STARTED }
export type TInProgressAppState = { appState: EAppState.IN_PROGRESS }
export type TErrorAppState = { appState: EAppState.ERROR, errorMessage: string }

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
    },
  }
})

export const uiReducer = ui.reducer
export const {setRoute, setAppState} = ui.actions