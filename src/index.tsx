import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {initStore} from './store'
import {Provider} from 'react-redux'
import {I18nextProvider} from 'react-i18next';
import {i18n} from "./services/i18n"


export const rootElement = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={initStore(rootElement, i18n)}>
      <I18nextProvider i18n={i18n} defaultNS={'translation'}>
        <App/>
      </I18nextProvider>
    </Provider>
  </React.StrictMode>
);
