/* eslint-disable no-param-reassign */

import config from '../../../config.json'
import { customAxios } from '../../utils/axios'
import User from '../models/User.model'

const getParams = (user) => {
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', user.refresh_token)
  return params
}

const formatSpotKeys = () => `${config.spotify.client_id}:${config.spotify.client_secret}`

const getHeaders = () => ({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(formatSpotKeys()).toString('base64')}`,
  },
  proxy: false,
})

// eslint-disable-next-line import/prefer-default-export
export const updateAccessToken = async (user) => {
  user = await User.findByPk(user.pseudo)
  if (user.expires_in > Date.now()) return user
  const { data } = await customAxios.post(
    'https://accounts.spotify.com/api/token',
    getParams(user),
    getHeaders()
  )

  user.access_token = data.access_token
  user.expires_in = Date.now() + data.expires_in
  if (data.refresh_token) user.refresh_token = data.refresh_token

  return user.save()
}
