// @flow

import { createAction } from 'redux-actions'

const _ = (string) => `DATA_EXPLORER/${string}`

export const SET_USERS = _('SET_USERS')
export const setUsers = createAction(SET_USERS, (data) => ({ data }))
