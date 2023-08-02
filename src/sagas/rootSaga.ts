import {fork,} from "redux-saga/effects";
import { Dispatch } from "@reduxjs/toolkit";
import {initSaga} from "./initSaga";


export function* rootSaga(dispatch: Dispatch, rootElement: HTMLElement) {
  yield fork(initSaga, dispatch, rootElement);
}
