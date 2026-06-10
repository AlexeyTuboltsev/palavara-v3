import { PayloadAction } from "@reduxjs/toolkit";
import {call, take} from "redux-saga/effects";
import {actions} from "../actions";
import {ELang} from "../services/i18n";

/**
 * Keep <html lang="..."> in sync with the active i18n language so
 * screen readers, browser features (auto-translate, dictionary picker)
 * and SEO crawlers see the correct language attribute as the user
 * navigates between EN and DE.
 */
function setHtmlLangAttribute(lang: ELang) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
  }
}

export function* langWatcherSaga(i18n:any){
  // Reflect the language i18n was initialized with so the first paint
  // already has the right <html lang>. (initSaga calls initI18n before
  // forking this saga, so i18n.language is already set here.)
  yield call(setHtmlLangAttribute, i18n.language as ELang);

  while(true){
    const {payload}:PayloadAction<ELang> = yield take(actions.changeLanguage.type)
    yield call(i18n.changeLanguage, payload)
    yield call(setHtmlLangAttribute, payload)
  }
}
