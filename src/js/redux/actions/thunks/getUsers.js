// @flow

import Axios from 'axios'
import { setUsers } from '../dataExplorer'

export const getUsers = () => (dispatch) => {
  Axios.get('api/users').then(({ data }) => dispatch(setUsers(data)))
}
