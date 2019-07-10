// @flow

import React from 'react'

const withFetcher = (WrappedComponent) =>
  class extends React.Component {
    componentDidMount() {
      const { getUsers } = this.props
      getUsers()
    }

    render() {
      return <WrappedComponent {...this.props} />
    }
  }

export default withFetcher
