import axios from 'axios'
import rax from 'retry-axios'

rax.attach(axios)

export const customAxios = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  headers: { post: { 'Content-Type': 'application/json' } },
  proxy: false,
})

customAxios.defaults.raxConfig = {
  instance: customAxios,
  statusCodesToRetry: [[429, 429]],
  retry: 5,
}

customAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Pixelle::axios.js::14::error =>', error)
    return Promise.reject(error.toJSON())
  }
)

const getToken = (user, spotConfig) => user[`access_token_${spotConfig}`]

export const getHeaders = (user, spotConfig = 1) => ({
  headers: { Authorization: `Bearer ${getToken(user, spotConfig)}` },
})

export const postHeaders = (user, spotConfig = 1) => ({
  headers: { Authorization: `Bearer ${getToken(user, spotConfig)}` },
})

export const getParams = (params, user, spotConfig = 1) => ({
  params,
  ...getHeaders(user, spotConfig),
})
