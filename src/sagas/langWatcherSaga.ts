import { PayloadAction } from "@reduxjs/toolkit";
import {call, take} from "redux-saga/effects";
import {actions} from "../actions";
import {ELang} from "../services/i18n";

export function* langWatcherSaga(i18n:any){
  console.log(i18n.t('console'))
  console.log(i18n)

  yield call(i18n.changeLanguage, ELang.RU )
  console.log(i18n.t('console'))

  while(true){
    const {payload}:PayloadAction<string> = yield take(actions.changeLanguage.type)
    yield call(i18n.changeLanguage, payload)

    console.log(i18n.t('console'))
  }
}