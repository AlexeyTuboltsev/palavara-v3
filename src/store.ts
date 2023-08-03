import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit'
import {uiReducer} from "./reducer";
import createSagaMiddleware from "redux-saga";
import {rootSaga} from "./sagas/rootSaga";

export type TStore = ReturnType<typeof store.getState>

let sagaMiddleware = createSagaMiddleware();
const middleware = [...getDefaultMiddleware({thunk: false}), sagaMiddleware];

const store = configureStore({
  devTools: true,
  middleware,
  reducer: {ui: uiReducer}
})

export function initStore(rootElement:HTMLElement, i18n:any){
  sagaMiddleware.run(rootSaga, store.dispatch, rootElement, i18n);
  return store
}
