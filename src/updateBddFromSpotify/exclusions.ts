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

const processTracksPlaylist = async (user: User, uri: string): Promise<void> => {
  const {
    data: { items: tracks, next },
  } = await customAxios(uri, getHeaders(user))

  const processTrack = async (): Promise<void> => {
    const trackEntry = tracks.pop()
    if (!trackEntry) return

    await addTrack(trackEntry.track, {
      linkTrackToUser: async (track) => track.addExcludedBy(user),
      shouldAddArtists: true,
    })

    if (tracks.length > 0) await processTrack()
  }

  await processTrack()

  if (next != null) await processTracksPlaylist(user, next)
}

const processArtistsPlaylist = async (user: User, uri: string): Promise<void> => {
  const {
    data: { items: tracks, next },
  } = await customAxios(uri, getHeaders(user))

  const processTrack = async (): Promise<void> => {
    const trackEntry = tracks.pop()
    if (!trackEntry) return

    await addArtists(trackEntry.track.artists, { linkArtistToUser: async (artist) => artist.addExcludedBy(user) })

    if (tracks.length > 0) await processTrack()
  }

  await processTrack()

  if (next != null) await processTracksPlaylist(user, next)
}

export default async (): Promise<void> => {
  try {
    await sequelize.transaction(async () => {
      await UserDislikesArtist.truncate()
      await UserDislikesTrack.truncate()

      const users = await User.findAll()
      const processUser = async (): Promise<void> => {
        const currentUser = users.pop()
        if (!currentUser) return

        const refreshedUser = await updateAccessToken(currentUser)
        await processTracksPlaylist(refreshedUser, `playlists/${refreshedUser.excludedTracksPlaylist}/tracks`)
        await processArtistsPlaylist(refreshedUser, `playlists/${refreshedUser.excludedArtistsPlaylist}/tracks`)

        if (users.length > 0) await processUser()
      }

      await processUser()
    })
  } catch (error) {
    console.error('exclusion::error =>', error)
  }
}
