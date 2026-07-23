import { User, UserLikesArtist, addArtists, sequelize, updateAccessToken } from '../sequelize'
import { customAxios, getHeaders } from '../utils'

const processArtists = async (user: User, uri = 'me/following?type=artist&limit=50'): Promise<void> => {
  const {
    data: {
      artists: { items: artists, next },
    },
  } = await customAxios.get(uri, getHeaders(user))

  await addArtists(artists, { linkArtistToUser: async (artist) => artist.addFollowedBy(user) })

  if (next != null) await processArtists(user, next)
}

export default async (): Promise<void> => {
  try {
    await sequelize.transaction(async () => {
      await UserLikesArtist.truncate()

      const users = await User.findAll()
      const processUser = async (): Promise<void> => {
        const currentUser = users.pop()
        if (!currentUser) return

        const refreshedUser = await updateAccessToken(currentUser)
        await processArtists(refreshedUser)

        if (users.length > 0) await processUser()
      }

      await processUser()
    })
  } catch (error) {
    console.error('followedArtists::error =>', error)
    throw error
  }
}
