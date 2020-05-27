import Axios from 'axios'

import { getIftttUser } from '../commonBDD'

export const getHeaders = (user) => ({
  headers: { Authorization: `Bearer ${user.access_token}` },
})

export const postHeaders = (user) => ({
  headers: {
    Authorization: `Bearer ${user.access_token}`,
    'Content-Type': 'application/json',
  },
})

export const getParams = (params, user) => ({ params, ...getHeaders(user) })

export const gestionErreur = (e, functionName) => {
  console.error(`ERREUR: ${functionName}`)
  if (e.isAxiosError) {
    console.log('url => ', e.config && e.config.url)
    console.log('data => ', e.config && e.config.data)
    console.log('status => ', e.response && e.response.status)

    getIftttUser().then((iftttUser) =>
      Axios.post(`https://maker.ifttt.com/trigger/error_occured/with/key/${iftttUser}`, {
        value1: e.response.status,
        value2: e.config.url,
      })
    )
  } else console.log('e => ', e)
}
