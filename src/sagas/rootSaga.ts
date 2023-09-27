import {call} from "redux-saga/effects";
import {Dispatch} from "@reduxjs/toolkit";
import {initSaga} from "./initSaga";

export function* rootSaga(dispatch: Dispatch, rootElement: HTMLElement, i18n: any) {
  yield call(initSaga, dispatch, rootElement, i18n);
}
