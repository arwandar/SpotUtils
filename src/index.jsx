import 'bootstrap/dist/css/bootstrap.css'

import './css/style.css'

import React from 'react'
import ReactDOM from 'react-dom'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

import App from './js/App'
import rootReducer from './js/redux'
import i18n from './js/utils/i18n'

/* eslint-disable-next-line no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(
  rootReducer,
  /* preloadedState, */
  composeEnhancers(applyMiddleware(thunk))
)

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <Provider store={store}>
      <App />
    </Provider>
  </I18nextProvider>,
  document.getElementById('react-container')
)

if (module.hot)
  // eslint-disable-line no-undef
  module.hot.accept() // eslint-disable-line no-undef
