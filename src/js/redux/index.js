import { combineReducers } from 'redux-immutable'

import dataExplorer from './reducers/dataExplorer'

const rootReducer = combineReducers({
  dataExplorer,
})

export default rootReducer
