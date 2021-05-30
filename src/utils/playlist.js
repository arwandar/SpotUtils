import { updateAccessToken } from '../sequelize'
import { customAxios, postHeaders } from './axios'

export const addTracksToPlaylist = async (user, playlistId, trackUris) => {
  if (trackUris.length === 0) return Promise.resolve()

  const updateUser = await updateAccessToken(user)
  await customAxios.post(
    `users/${updateUser.id}/playlists/${playlistId}/tracks`,
    { uris: trackUris.splice(0, 100) },
    postHeaders(updateUser)
  )
  return addTracksToPlaylist(updateUser, playlistId, trackUris)
}

export const refillPlaylist = async (user, playlistId, trackUris) => {
  const updateUser = await updateAccessToken(user)
  await customAxios.put(
    `users/${updateUser.id}/playlists/${playlistId}/tracks`,
    { uris: trackUris.splice(0, 100) },
    postHeaders(updateUser)
  )
  await addTracksToPlaylist(updateUser, playlistId, trackUris)
}
