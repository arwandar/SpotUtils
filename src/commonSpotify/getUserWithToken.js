import Axios from 'axios'
import moment from 'moment'
import qs from 'query-string'

import { getSpotParams, getUser, setUser } from '../commonBDD'

const formatSpotKeys = (spotParams: Object) => `${spotParams.client_id}:${spotParams.client_secret}`

const getHeaders = (spotParams: Object) => ({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(formatSpotKeys(spotParams)).toString('base64')}`,
  },
})

export default (username: String) =>
  getUser(username).then((user: Object): Promise<String> => {
    let updatedUser
    return getSpotParams()
      .then((spotParams: Object) =>
        Axios.post(
          'https://accounts.spotify.com/api/token',
          qs.stringify({ grant_type: 'refresh_token', refresh_token: user.refresh_token }),
          getHeaders(spotParams)
        )
      )
      .then(({ data }) => {
        updatedUser = {
          ...user,
          access_token: data.access_token,
          expires_in: moment().add(data.expires_in, 'seconds'),
        }
        if (data.refresh_token) updatedUser.refresh_token = data.refresh_token
        return setUser(updatedUser)
      })
      .then(() => updatedUser)
      .catch(() => console.log('ERREUR::getUserWithToken.js'))
  })
