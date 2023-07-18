import {configureStore, getDefaultMiddleware} from '@reduxjs/toolkit'
import {uiReducer} from "./reducer";
import createSagaMiddleware from "redux-saga";
import {rootSaga} from "./sagas/rootSaga";


let sagaMiddleware = createSagaMiddleware();
const middleware = [...getDefaultMiddleware({ thunk: false }), sagaMiddleware];

export const store = configureStore({
    devTools: true,
    middleware,
    reducer: {ui:uiReducer}
})

sagaMiddleware.run(rootSaga);