import i18n, {i18n as I18n} from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

export enum ELang {
  EN = 'en',
  RU = 'ru',
}

function initI18n(i18n:I18n, lng: ELang){
  return i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
    fallbackLng: 'en',
    debug: true,
    lng,
    ns:['translation'],
    interpolation: {
      escapeValue: false,
    },
  })
}

export {i18n, initI18n};
