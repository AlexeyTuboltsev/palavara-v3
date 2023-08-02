import {fork,} from "redux-saga/effects";

import {initSaga} from "./initSaga";


export function* rootSaga() {
  yield fork(initSaga);
}
