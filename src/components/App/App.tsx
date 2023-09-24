import React, {FC} from 'react';
import {useSelector} from 'react-redux'
import {EAppState, TReadyAppState} from "../../reducer";
import {TStore} from "../../store";
import {ERoute} from "../../router";
import {Home} from "../../routes/home/home";
import {OtherRoute} from "../../routes/otherRoute/otherRoute";
import {RouteThree} from "../../routes/routeThree/routeThree";


export const App = () => {
    const state = useSelector((store: TStore) => store.ui)
    switch (state.appState){
        case EAppState.NOT_STARTED:
            return <AppNotStarted />
        case EAppState.IN_PROGRESS:
            return <AppInProgress />
        case EAppState.READY:
            return <AppReady {...state} />
        case EAppState.ERROR:
            return <AppError />
    }
}

export const AppNotStarted = () => <div>starting</div>
export const AppInProgress = () => <div>starting...</div>
export const AppError = () => <div>error</div>

export const AppReady:FC<TReadyAppState> = (state) => {
    switch (state.route.routeName) {
        case ERoute.HOME:
            return <Home state={state}/>;

        case ERoute.ROUTE_TREE:
            return <RouteThree/>;
        default:
            return null
    }
}
