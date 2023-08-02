import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initStore} from './store'
import {Provider} from 'react-redux'

export const rootElement = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={initStore(rootElement)}>
      <App/>
    </Provider>
  </React.StrictMode>
);
