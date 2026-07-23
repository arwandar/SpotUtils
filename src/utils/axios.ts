import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import axiosRetry from 'axios-retry'
import config from '../../config.json'
import { User } from '../sequelize'
import type { SpotifyTokenResponse } from './type'

type CustomAxiosRequestConfig = AxiosRequestConfig & {
  user?: User
  spotConfig?: number
  _retry?: boolean
}

const tokenApi = 'https://accounts.spotify.com/api/token'

const formatSpotKeys = (spotConfig = 1) =>
  `${config[`spotify_${spotConfig}` as keyof typeof config].client_id}:${config[`spotify_${spotConfig}` as keyof typeof config].client_secret}`

const getTokenRequestHeaders = (spotConfig = 1) => ({
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(formatSpotKeys(spotConfig)).toString('base64')}`,
  },
})

const isTokenExpiredError = (error: AxiosError<{ error?: { status?: number; message?: string } }>) => {
  const message = error.response?.data?.error?.message?.toLowerCase() ?? ''
  const status = error.response?.data?.error?.status
  const httpStatus = error.response?.status

  return httpStatus === 400 && (status === 401 || message.includes('invalid_token') || message.includes('expired token'))
}

const refreshAccessToken = async (user: User, spotConfig: number): Promise<User> => {
  const dbUser = await User.findByPk(user.pseudo)
  if (!dbUser) throw new Error(`User ${user.pseudo} not found`)

  const refreshTokenValue = dbUser[`refresh_token_${spotConfig}` as keyof User] as string | null
  if (!refreshTokenValue) throw new Error(`No refresh token configured for spotConfig ${spotConfig}`)

  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', refreshTokenValue)

  const { data }: SpotifyTokenResponse = await axios.post(tokenApi, params, getTokenRequestHeaders(spotConfig))

  const accessTokenField = `access_token_${spotConfig}` as const
  const expiresInField = `expires_in_${spotConfig}` as const
  const refreshTokenField = `refresh_token_${spotConfig}` as const

  Object.assign(dbUser, {
    [accessTokenField]: data.access_token,
    [expiresInField]: Date.now() + data.expires_in,
    ...(data.refresh_token ? { [refreshTokenField]: data.refresh_token } : {}),
  })

  await dbUser.save()
  return dbUser
}

export const customAxios = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  headers: { post: { 'Content-Type': 'application/json' } },
  proxy: false,
})

axiosRetry(customAxios, {
  retryDelay: axiosRetry.exponentialDelay,
  retries: 5,
  retryCondition: (error) => error.response?.status === 429,
})

customAxios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { status?: number; message?: string } }>) => {
    const requestConfig = error.config as CustomAxiosRequestConfig | undefined

    if (requestConfig && requestConfig.user && requestConfig.spotConfig && !requestConfig._retry && isTokenExpiredError(error)) {
      requestConfig._retry = true

      try {
        const refreshedUser = await refreshAccessToken(requestConfig.user, requestConfig.spotConfig)
        const updatedAccessToken = refreshedUser[`access_token_${requestConfig.spotConfig}` as keyof User] as string

        requestConfig.headers = {
          ...requestConfig.headers,
          Authorization: `Bearer ${updatedAccessToken}`,
        }

        return customAxios.request(requestConfig)
      } catch (refreshError) {
        console.error('spotify token refresh failed', refreshError)
        return Promise.reject(refreshError)
      }
    }

    console.log('Pixelle::axios.js::14::error =>', error)
    return Promise.reject(error.toJSON ? error.toJSON() : error)
  }
)

const getToken = (user: User, spotConfig: number) => user[`access_token_${spotConfig}` as keyof User] as string

export const getHeaders = (user: User, spotConfig = 1) => ({
  user,
  spotConfig,
  headers: { Authorization: `Bearer ${getToken(user, spotConfig)}` },
})

export const postHeaders = (user: User, spotConfig = 1) => ({
  user,
  spotConfig,
  headers: { Authorization: `Bearer ${getToken(user, spotConfig)}` },
})

export const getParams = (params: Record<string, unknown>, user: User, spotConfig = 1) => ({
  params,
  ...getHeaders(user, spotConfig),
})
