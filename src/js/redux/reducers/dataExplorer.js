// @flow

import { fromJS } from 'immutable'
import { handleActions } from 'redux-actions'
import { SET_USERS } from '../actions/dataExplorer'

const initialState = fromJS({})

const reducer = handleActions(
  {
    [SET_USERS]: (state, action) => state.set('users', fromJS(action.payload.data)),
  },
  initialState
)

export default reducer
