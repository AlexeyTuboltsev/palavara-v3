import { PayloadAction } from "@reduxjs/toolkit";
import {call, take} from "redux-saga/effects";
import {actions} from "../actions";
import {ELang} from "../services/i18n";

export function* langWatcherSaga(i18n:any){
  yield call(i18n.changeLanguage, ELang.RU )

  while(true){
    const {payload}:PayloadAction<string> = yield take(actions.changeLanguage.type)
    yield call(i18n.changeLanguage, payload)
  }
}
