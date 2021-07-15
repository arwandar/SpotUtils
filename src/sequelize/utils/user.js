/* eslint-disable no-param-reassign */

import config from '../../../config.json'
import { customAxios } from '../../utils/axios'
import User from '../models/User.model'

const tokenApi = 'https://accounts.spotify.com/api/token'

const getParams = (user, spotConfig = 1) => {
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', user[`refresh_token_${spotConfig}`])
  return params
}

const formatSpotKeys = (spotConfig = 1) =>
  `${config[`spotify_${spotConfig}`].client_id}:${config[`spotify_${spotConfig}`].client_secret}`

const getHeaders = (spotConfig = 1) => ({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(formatSpotKeys(spotConfig)).toString('base64')}`,
  },
  proxy: false,
})

export const getMe = async (pseudo) => {
  const user = await User.findByPk(pseudo)

  const { data } = await customAxios.get('me', {
    headers: { Authorization: `Bearer ${user.access_token_1}` },
  })

  user.id = data.id
  return user.save()
}

export const updateAccessToken = async (user, spotConfig = 1) => {
  user = await User.findByPk(user.pseudo)
  if (user[`expires_in_${spotConfig}`] > Date.now()) return user
  const { data } = await customAxios.post(
    tokenApi,
    getParams(user, spotConfig),
    getHeaders(spotConfig)
  )

  user[`access_token_${spotConfig}`] = data.access_token
  user[`expires_in_${spotConfig}`] = Date.now() + data.expires_in
  if (data.refresh_token) user[`refresh_token_${spotConfig}`] = data.refresh_token

  return user.save()
}

export const getAccessToken1 = async (pseudo, code) => {
  const user = { pseudo, id: 'tmp' }

  const params = new URLSearchParams()
  params.append('code', code)
  params.append('grant_type', 'authorization_code')
  params.append('redirect_uri', config.spotify_1.redirect_uri)

  const { data } = await customAxios.post(tokenApi, params, getHeaders())

  user.access_token_1 = data.access_token
  user.expires_in_1 = Date.now() + data.expires_in
  user.refresh_token_1 = data.refresh_token

  return User.create(user)
}

export const getAccessToken2 = async (pseudo, code) => {
  const user = await User.findByPk(pseudo)

  const params = new URLSearchParams()
  params.append('code', code)
  params.append('grant_type', 'authorization_code')
  params.append('redirect_uri', config.spotify_2.redirect_uri)

  const { data } = await customAxios.post(tokenApi, params, getHeaders(2))

  user.access_token_2 = data.access_token
  user.expires_in_2 = Date.now() + data.expires_in
  user.refresh_token_2 = data.refresh_token

  await user.save()

  return getMe(user.pseudo)
}
