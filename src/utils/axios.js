import axios from 'axios'

import { addError } from '../sequelize/utils/error'

export const customAxios = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  headers: { post: { 'Content-Type': 'application/json' } },
  proxy: false,
})

customAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Pixelle::axios.js::14::error =>', error)
    addError(error)
    return Promise.reject(error)
  }
)

export const getHeaders = (user, spotConfig = 1) => ({
  headers: { Authorization: `Bearer ${user[`access_token_${spotConfig}`]}` },
})

export const postHeaders = (user, spotConfig = 1) => ({
  headers: { Authorization: `Bearer ${user[`access_token_${spotConfig}`]}` },
})

export const getParams = (params, user, spotConfig = 1) => ({
  params,
  ...getHeaders(user, spotConfig),
})
