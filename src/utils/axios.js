import axios from 'axios'

export const customAxios = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  headers: { post: { 'Content-Type': 'application/json' } },
  proxy: false,
})

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
