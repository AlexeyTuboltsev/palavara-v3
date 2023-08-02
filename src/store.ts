import {configureStore, getDefaultMiddleware, Dispatch} from '@reduxjs/toolkit'
import {uiReducer} from "./reducer";
import createSagaMiddleware from "redux-saga";
import {rootSaga} from "./sagas/rootSaga";

export type TStore = ReturnType<typeof store.getState>
export type TDispatch = ReturnType<typeof store.dispatch>

let sagaMiddleware = createSagaMiddleware();
const middleware = [...getDefaultMiddleware({thunk: false}), sagaMiddleware];

export const store = configureStore({
  devTools: true,
  middleware,
  reducer: {ui: uiReducer}
})

sagaMiddleware.run(rootSaga, store.dispatch);