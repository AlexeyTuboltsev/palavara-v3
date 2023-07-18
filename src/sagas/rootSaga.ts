import {put, fork} from "redux-saga/effects";
import {myAction} from "../reducer";
import {actions} from '../actions'

function* initSaga(){
  yield put(actions.initStarted())
  const location = window.location
  put(myAction())
}

export function* rootSaga() {
  yield fork(initSaga);
}
