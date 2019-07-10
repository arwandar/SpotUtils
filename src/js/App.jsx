// @flow

import React from 'react'

import Header from './components/Header'
import withFetcher from './components/withFetcher'

const App = () => (
  <React.Fragment>
    <Header />
  </React.Fragment>
)

export default withFetcher(App)
