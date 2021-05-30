import axios from 'axios'

export const customAxios = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  headers: { post: { 'Content-Type': 'application/json' } },
  proxy: false,
})

export const getHeaders = (user) => ({ headers: { Authorization: `Bearer ${user.access_token}` } })

export const postHeaders = (user) => ({ headers: { Authorization: `Bearer ${user.access_token}` } })

export const getParams = (params, user) => ({ params, ...getHeaders(user) })
