import { customAxios, postHeaders } from './axios.js'

import { updateAccessToken, User } from '../sequelize/index.js'

export const addTracksToPlaylist = async (user: User, playlistId: string, trackUris: string[]): Promise<void> => {
  if (trackUris.length === 0) return Promise.resolve()

  const updateUser = await updateAccessToken(user)
  await customAxios.post(
    `playlists/${playlistId}/tracks`,
    { uris: trackUris.splice(0, 100) },
    postHeaders(updateUser)
  )
  return addTracksToPlaylist(updateUser, playlistId, trackUris)
}

export const refillPlaylist = async (user: User, playlistId: string, trackUris: string[]) => {
  const updateUser = await updateAccessToken(user)
  await customAxios.put(
    `playlists/${playlistId}/tracks`,
    { uris: trackUris.splice(0, 100) },
    postHeaders(updateUser)
  )
  await addTracksToPlaylist(updateUser, playlistId, trackUris)
}
