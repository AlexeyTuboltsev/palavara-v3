import { PayloadAction } from "@reduxjs/toolkit";
import {call, take} from "redux-saga/effects";
import {actions} from "../actions";

export function* langWatcherSaga(i18n:any){
  while(true){
    const {payload}:PayloadAction<string> = yield take(actions.changeLanguage.type)
    yield call(i18n.changeLanguage, payload)
  }
}
