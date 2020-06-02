import moment from 'moment'

import { getSpotParams, getUser, setUser } from '../commonBDD'
import Axios, { gestionErreur } from './utils'

const formatSpotKeys = (spotParams: Object) => `${spotParams.client_id}:${spotParams.client_secret}`

const getHeaders = (spotParams: Object) => ({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(formatSpotKeys(spotParams)).toString('base64')}`,
  },
  proxy: false,
})

const getParams = (user) => {
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', user.refresh_token)
  return params
}

export default (username: String) => {
  let updatedUser
  return getUser(username)
    .then((user) => {
      updatedUser = user
      return getSpotParams()
    })
    .then((spotParams) =>
      Axios.post(
        'https://accounts.spotify.com/api/token',
        getParams(updatedUser),
        getHeaders(spotParams)
      )
    )
    .then(({ data }) => {
      updatedUser = {
        ...updatedUser,
        access_token: data.access_token,
        expires_in: moment().add(data.expires_in, 'seconds'),
      }
      if (data.refresh_token) updatedUser.refresh_token = data.refresh_token
      return setUser(updatedUser)
    })
    .then(() => updatedUser)
    .catch((e) => gestionErreur(e, `getUserWithToken ${username}`))
}
