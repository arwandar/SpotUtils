import {
  User,
  UserDislikesArtist,
  UserDislikesTrack,
  addArtists,
  addTrack,
  sequelize,
  updateAccessToken,
} from '../sequelize'
import { customAxios, getHeaders } from '../utils'

const processTracksPlaylist = async (user, uri?: string) => {
  const {
    data: { items: tracks, next },
  } = await customAxios(uri, getHeaders(user))

  const processTrack = async () => {
    const track = tracks.pop()

    await addTrack(track.track, {
      linkFctToUser: (tmp) => tmp.addExcludedBy(user),
      shouldAddArtists: true,
    })

    return tracks.length ? processTrack() : Promise.resolve()
  }

  await processTrack()
  return next != null ? processTracksPlaylist(user, next) : Promise.resolve()
}

const processArtistsPlaylist = async (user, uri?: string) => {
  const {
    data: { items: tracks, next },
  } = await customAxios(uri, getHeaders(user))

  const processTrack = async () => {
    const track = tracks.pop()

    await addArtists(track.track.artists, { linkFctToUser: (tmp) => tmp.addExcludedBy(user) })

    return tracks.length ? processTrack() : Promise.resolve()
  }

  await processTrack()
  return next != null ? processTracksPlaylist(user, next) : Promise.resolve()
}

export default async () => {
  try {
    return sequelize.transaction(async () => {
      await UserDislikesArtist.truncate()
      await UserDislikesTrack.truncate()

      const users = await User.findAll()
      const processUser = async () => {
        let currentUser = users.pop()

        currentUser = await updateAccessToken(currentUser)
        await processTracksPlaylist(
          currentUser,
          `playlists/${currentUser.excludedTracksPlaylist}/tracks`
        )
        await processArtistsPlaylist(
          currentUser,
          `playlists/${currentUser.excludedArtistsPlaylist}/tracks`
        )
        return users.length > 0 ? processUser() : Promise.resolve()
      }

      return processUser()
    })
  } catch (error) {
    console.error('exclusion::error =>', error)
    return Promise.reject()
  }
}
