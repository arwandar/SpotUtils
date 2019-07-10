// @flow

import { connect } from 'react-redux'
import { bindActionCreators, compose } from 'redux'

import { getUsers } from '../../redux/actions/thunks/getUsers'
import withFetcher from './withFetcher'

const mapStateToProps = () => ({})

const mapDispatchToProps = (dispatch) => ({
  getUsers: bindActionCreators(getUsers, dispatch),
})

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withFetcher
)
