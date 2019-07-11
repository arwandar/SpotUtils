// @flow

import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import messageFr from './messages-fr'

i18next.use(initReactI18next).init({
  lng: 'fr',
  debug: true,
  keySeparator: false,
  interpolation: { escapeValue: false },
  ns: ['default'],
  defaultNS: 'default',
  resources: {
    fr: { default: messageFr },
  },
})

export default i18next
