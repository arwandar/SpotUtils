import { User, UserLikesArtist, addArtists, sequelize, updateAccessToken } from '../sequelize'
import { customAxios, getHeaders } from '../utils'

const processArtists = async (user: Object, uri?: string = 'me/following?type=artist&limit=50') => {
  const {
    data: {
      artists: { items: artists, next },
    },
  } = await customAxios.get(uri, getHeaders(user))

  await addArtists(artists, { linkFctToUser: (tmp) => tmp.addFollowedBy(user) })
  return next != null ? processArtists(user, next) : Promise.resolve()
}

export default async () => {
  try {
    return sequelize.transaction(async () => {
      await UserLikesArtist.truncate()

      const users = await User.findAll()
      const processUser = async () => {
        let currentUser = users.pop()

        currentUser = await updateAccessToken(currentUser)
        await processArtists(currentUser)
        return users.length > 0 ? processUser() : Promise.resolve()
      }

      return processUser()
    })
  } catch (error) {
    console.error('followedArtists::error =>', error)
    return Promise.reject(error)
  }
}
