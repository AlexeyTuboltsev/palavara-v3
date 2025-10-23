import {TRoute} from "./router";
import {TAction} from "./actions";
import {EScreenSize} from "./routes/common/screenSize";

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
  menuIsOpen:boolean,
  menuIsCollapsible: boolean;
  screenSize: EScreenSize,
  sectionMenu: TSectionMenuItem[],
  menu: { root: TMenuItem } & { [id: string]: TMenuItem }
}

export enum EMenuType {
  SIMPLE = "simple",
  PARENT = "parent",
  CHILD = "child",
  ROOT = 'root'
}

export enum ESectionMenuDisplayType {
  MAIN = "main",
  SECONDARY = "secondary",
}

export type TSectionMenuItem = { id: string, mobileDisplayType:ESectionMenuDisplayType, label: string, isActive: boolean, action: TAction }

type TMenuItemCommonProps = {
  id: string,
  label: string,
  isActive: boolean,
  action: TAction
}
export type TRootMenuItem = { id: 'root', type: EMenuType.ROOT, children: string[] }
export type TParentMenuItem = { type: EMenuType.PARENT, children: string[] } & TMenuItemCommonProps
export type TChildMenuItem = { type: EMenuType.CHILD, parentId: string } & TMenuItemCommonProps
export type TSimpleMenuItem = { type: EMenuType.SIMPLE } & TMenuItemCommonProps
export type TMenuItem =
  | TRootMenuItem
  | TChildMenuItem
  | TParentMenuItem
  | TSimpleMenuItem

export type TNotStartedAppState = { appState: EAppState.NOT_STARTED }
export type TInProgressAppState = { appState: EAppState.IN_PROGRESS }
export type TErrorAppState = { appState: EAppState.ERROR, errorMessage: string }