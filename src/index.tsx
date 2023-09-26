import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import {initStore} from './store'
import {Provider} from 'react-redux'
import {I18nextProvider} from 'react-i18next';
import {i18n} from "./services/i18n"
import {initSentry} from "./services/sentry";
import {ErrorBoundary} from './components/ErrorBoundary';
import {App} from './components/App'

initSentry()

export const rootElement = document.getElementById('root') as HTMLElement
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={initStore(rootElement, i18n)}>
        <I18nextProvider i18n={i18n}>
          <App/>
        </I18nextProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
