import {call, fork, put, select, take} from "redux-saga/effects";
import {Dispatch} from "@reduxjs/toolkit";
import {initSaga} from "./initSaga";
import {actions, TAction} from "../actions";
import {EMenuType, setAppState, TMenuItem, TReadyAppState} from "../reducer";


export function* rootSaga(dispatch: Dispatch, rootElement: HTMLElement, i18n: any) {
  yield call(initSaga, dispatch, rootElement, i18n);
}
