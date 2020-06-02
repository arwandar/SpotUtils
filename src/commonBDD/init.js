import storage from 'node-persist'

export const artistsStorage = storage.create({ dir: './.node-persist/artists', logging: false })
export const usersStorage = storage.create({ dir: './.node-persist/users', logging: false })
export const paramsStorage = storage.create({ dir: './.node-persist/params', logging: false })

export default () =>
  Promise.all(
    [usersStorage, artistsStorage, paramsStorage, artistsStorage].map((key) => key.init())
  )
