import axios from 'axios'
import moment from 'moment'

import { getIftttUser } from '../commonBDD'

const Axios = axios.create({
  baseURL: 'https://api.spotify.com/v1/',
  headers: {
    post: { 'Content-Type': 'application/json' },
  },
  // proxy: false,
})

export default Axios

export const getHeaders = (user) => ({
  headers: { Authorization: `Bearer ${user.access_token}` },
})

export const postHeaders = (user) => ({
  headers: {
    Authorization: `Bearer ${user.access_token}`,
  },
})

export const getParams = (params, user) => ({ params, ...getHeaders(user) })

export const gestionErreur = (e, functionName) => {
  console.error(`ERREUR::${moment().toISOString()}  ${functionName}`)
  if (e && e.isAxiosError) {
    console.log('url => ', e.config && e.config.url)
    console.log('data => ', e.config && e.config.data)
    console.log('status => ', e.response && e.response.status)

    getIftttUser().then((iftttUser) =>
      axios
        .post(`https://maker.ifttt.com/trigger/error_occured/with/key/${iftttUser}`, {
          value1: e.response.status,
          value2: e.config.url,
        })
        .catch(() => console.error('Notif Ifttt non envoyée'))
    )
  } else console.log('e => ', e)
  return Promise.reject()
}
