import { paramsStorage } from './init'

export const getSpotParams = (): Promise<Object> =>
  paramsStorage
    .getItem('spotParams')
    .then((spotParams) => {
      if (!spotParams) {
        paramsStorage.setItem('spotParams', {
          redirect_uri: 'http://localhost:3002/callback',
          client_id: 'TODO',
          client_secret: 'TODO',
        })
        return getSpotParams
      }
      return spotParams
    })
    .catch(() => console.log('erreur lors de getSpotParams'))

export const getGistParams = (): Promise<Object> =>
  paramsStorage
    .getItem('gistParams')
    .then((gistParams) => {
      if (!gistParams) {
        paramsStorage.setItem('gistParams', {
          token: 'TODO',
          id: 'TODO',
        })
        return getGistParams
      }
      return gistParams
    })
    .catch(() => console.log('erreur lors de getGistParams'))

export const getIftttUser = () =>
  paramsStorage.getItem('iftttUser').catch(() => console.log('erreur lors de getIftttUser'))

export const setIftttUser = (val) => paramsStorage.setItem('iftttUser', val)
