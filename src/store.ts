import {configureStore, createSlice, getDefaultMiddleware, PayloadAction} from '@reduxjs/toolkit'
import createSagaMiddleware from "redux-saga";
import {rootSaga} from "./sagas/rootSaga";
import {EAppState, TAppState} from "./types";

export type TStore = ReturnType<typeof store.getState>

let sagaMiddleware = createSagaMiddleware();
const middleware = [...getDefaultMiddleware({thunk: false}), sagaMiddleware];

const ui = createSlice({
  name: 'ui',
  initialState: {
    appState: EAppState.NOT_STARTED
  } as TAppState,
  reducers: {
    setAppState: (state, action: PayloadAction<TAppState>) => {
      return action.payload
    },
  }
})

const navigation = createSlice({
  name: 'navigation',
  initialState: {isNavigating: false},
  reducers: {
    startNavigation: (state) => {
      state.isNavigating = true;
    },
    endNavigation: (state) => {
      state.isNavigating = false;
    },
  }
})

const store = configureStore({
  devTools: true,
  middleware,
  reducer: {ui: ui.reducer, navigation: navigation.reducer}
})

export function initStore(rootElement:HTMLElement, i18n:any){
  sagaMiddleware.run(rootSaga, store.dispatch, rootElement, i18n);
  return store
}


export const {setAppState} = ui.actions
export const {startNavigation, endNavigation} = navigation.actions
