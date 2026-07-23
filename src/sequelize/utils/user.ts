import config from '../../../config.json'
import { customAxios } from '../../utils/axios'
import type { SpotifyTokenResponse } from '../../utils/type'
import User from '../models/User.model'

const tokenApi = 'https://accounts.spotify.com/api/token'

const getParams = (user: User, spotConfig = 1) => {
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', user[`refresh_token_${spotConfig}` as keyof User] as string)
  return params
}

const formatSpotKeys = (spotConfig = 1) =>
  `${config[`spotify_${spotConfig}` as keyof typeof config].client_id}:${config[`spotify_${spotConfig}` as keyof typeof config].client_secret}`

const getHeaders = (spotConfig = 1): { headers: { 'Content-Type': string; Authorization: string }; proxy: false } => ({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(formatSpotKeys(spotConfig)).toString('base64')}`,
  },
  proxy: false,
})

const getTokenFields = (spotConfig = 1) => ({
  accessTokenField: `access_token_${spotConfig}` as const,
  expiresInField: `expires_in_${spotConfig}` as const,
  refreshTokenField: `refresh_token_${spotConfig}` as const,
})

export const getMe = async (pseudo: string) => {
  const dbUser = await User.findByPk(pseudo)
  if (!dbUser) throw new Error(`User ${pseudo} not found`)

  const { data } = await customAxios.get('me', {
    headers: { Authorization: `Bearer ${dbUser.access_token_1}` },
  })

  dbUser.id = data.id
  return dbUser.save()
}

export const updateAccessToken = async (user: User, spotConfig = 1) => {
  const dbUser = await User.findByPk(user.pseudo)
  if (!dbUser) throw new Error(`User ${user.pseudo} not found`)

  const { accessTokenField, expiresInField, refreshTokenField } = getTokenFields(spotConfig)
  const expiresIn = Number(dbUser[expiresInField as keyof User])

  if (expiresIn > Date.now()) return dbUser

  const { data }: SpotifyTokenResponse = await customAxios.post(
    tokenApi,
    getParams(dbUser, spotConfig),
    getHeaders(spotConfig)
  )

  Object.assign(dbUser, {
    [accessTokenField]: data.access_token,
    [expiresInField]: Date.now() + data.expires_in,
    ...(data.refresh_token ? { [refreshTokenField]: data.refresh_token } : {}),
  })

  return dbUser.save()
}

export const getAccessToken1 = async (pseudo: string, code: string) => {
  console.log(`getAccessToken1 for ${pseudo} with code ${code}`)

  const dbUser = await User.findByPk(pseudo)

  const newUser = dbUser || User.build({ pseudo, id: 'tmp' })

  const params = new URLSearchParams()
  params.append('code', code)
  params.append('grant_type', 'authorization_code')
  params.append('redirect_uri', config.spotify_1.redirect_uri)

  const { data }: SpotifyTokenResponse = await customAxios.post(tokenApi, params, getHeaders())

  Object.assign(newUser, {
    access_token_1: data.access_token,
    expires_in_1: Date.now() + data.expires_in,
    refresh_token_1: data.refresh_token,
  })

  return newUser.save()
}

export const getAccessToken2 = async (pseudo: string, code: string) => {
  const dbUser = await User.findByPk(pseudo)
  if (!dbUser) throw new Error(`User ${pseudo} not found`)

  const params = new URLSearchParams()
  params.append('code', code)
  params.append('grant_type', 'authorization_code')
  params.append('redirect_uri', config.spotify_2.redirect_uri)

  const { data }: SpotifyTokenResponse = await customAxios.post(tokenApi, params, getHeaders(2))

  Object.assign(dbUser, {
    access_token_2: data.access_token,
    expires_in_2: Date.now() + data.expires_in,
    refresh_token_2: data.refresh_token,
  })

  await dbUser.save()

  return getMe(dbUser.pseudo)
}
