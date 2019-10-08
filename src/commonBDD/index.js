import storage from 'node-persist'

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
  storage.getItem('spotParams').catch(() => console.log('erreur lors de getSpotParams'))
/* {
  redirect_uri: 'http://localhost:3002/callback',
  client_id: 'TODO',
  client_secret: 'TODO',
} */

export const getGistParams = (): Promise<Object> =>
  storage.getItem('gistParams').catch(() => console.log('erreur lors de getGistParams'))
/* {
  redirect_uri: 'http://localhost:3002/gistCallback',
  client_id: 'TODO',
  client_secret: 'TODO',
} */

export const getOldTracks = (): Promise<Array<Object>> =>
  storage.getItem('RadarTracks').catch(() => console.log('erreur lors de getOldTracks'))

export const setOldTracks = (oldTracks: Array): Promise<void> =>
  storage.setItem('RadarTracks', oldTracks)
