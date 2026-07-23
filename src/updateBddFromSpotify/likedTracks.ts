import { User, UserLikesTrack, addTrack, sequelize, updateAccessToken } from '../sequelize'
import { customAxios, getParams } from '../utils'
import type { SpotifyPaginatedItems, SpotifyTrackEntry } from '../utils/type'

const debug = false

const processTracks = async (user: User, uri = 'me/tracks?limit=50'): Promise<void> => {
  const {
    data: { items: tracks, next },
  }: { data: SpotifyPaginatedItems<SpotifyTrackEntry> } = await customAxios.get(uri, getParams({ market: 'FR' }, user))

  const processTrack = async (): Promise<void> => {
    const trackEntry = tracks.pop()
    if (!trackEntry) return

    await addTrack(trackEntry.track, {
      linkTrackToUser: async (track: { addOwner: (user: User) => Promise<unknown> }) => track.addOwner(user),
      shouldAddArtists: true,
    })

    if (tracks.length > 0) await processTrack()
  }

  await processTrack()

  if (next != null && !debug) await processTracks(user, next)
}

export default async (): Promise<void> => {
  try {
    await sequelize.transaction(async () => {
      await UserLikesTrack.truncate()

      const users = await User.findAll()
      const processUser = async (): Promise<void> => {
        const currentUser = users.pop()
        if (!currentUser) return

        const refreshedUser = await updateAccessToken(currentUser)
        await processTracks(refreshedUser)

        if (users.length > 0) await processUser()
      }

      await processUser()
    })
  } catch (error) {
    console.error('likedTracks::error =>', error)
  }
}
