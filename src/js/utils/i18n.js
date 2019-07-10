// @flow

import i18next from 'i18next'
import { reactI18nextModule } from 'react-i18next'

i18next.use(reactI18nextModule).init({
  lng: 'fr',
  debug: true,
  keySeparator: false,
  interpolation: { escapeValue: false },
  react: {
    wait: true,
  },
})

export default i18next
