import storage from 'node-persist'

export const initStorage = () =>
  storage.init({
    logging: false,
    dir: './.node-persist/storage',
  })

export const getUser = (username: String): Promise<Object> =>
  storage.getItem(`user_${username}`).catch(() => console.log('erreur lors de getUser'))

export const setUser = (user: Object): Promise<void> => storage.setItem(`user_${user.name}`, user)

export const getUsernames = (): Promise<Array<String>> =>
  storage
    .keys()
    .then((keys) => keys.filter((key) => /user/.test(key)).map((key) => key.match(/user_(\w*)/)[1]))

export const getSpotParams = (): Promise<Object> =>
  storage
    .getItem('spotParams')
    .then((spotParams) => {
      if (!spotParams) {
        storage.setItem('spotParams', {
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
  storage
    .getItem('gistParams')
    .then((gistParams) => {
      if (!gistParams) {
        storage.setItem('gistParams', {
          token: 'TODO',
          id: 'TODO',
        })
        return getGistParams
      }
      return gistParams
    })
    .catch(() => console.log('erreur lors de getSpotParams'))

export const getOldTracks = (): Promise<Array<Object>> =>
  storage.getItem('RadarTracks').catch(() => console.log('erreur lors de getOldTracks'))

export const setOldTracks = (oldTracks: Array): Promise<void> =>
  storage.setItem('RadarTracks', oldTracks)
