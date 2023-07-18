import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {store} from './store'
import {Provider} from 'react-redux'

export enum ERoute {
  HOME = "home",
  OTHER_ROUTE = 'otherRoute',
}

export type TRoute =
  | ({ routeName: ERoute.HOME } & { params: {} })
  | ({ routeName: ERoute.OTHER_ROUTE } & { params: {} })


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App/>
    </Provider>
  </React.StrictMode>
);
