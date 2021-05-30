import { User, UserLikesTrack, addTrack, sequelize, updateAccessToken } from '../sequelize'
import { customAxios, getParams } from '../utils'

const debug = false

const processTracks = async (user: Object, uri?: string = 'me/tracks?limit=50') => {
  const {
    data: { items: tracks, next },
  } = await customAxios.get(uri, getParams({ market: 'FR' }, user))

  const processTrack = async () => {
    const { track } = tracks.pop()

    await addTrack(track, {
      linkFctToUser: (tmp) => tmp.addOwner(user),
      shouldAddArtists: true,
    })

    return tracks.length > 0 ? processTrack() : Promise.resolve()
  }

  await processTrack()
  return next != null && !debug ? processTracks(user, next) : Promise.resolve()
}

export default async () => {
  try {
    return sequelize.transaction(async () => {
      await UserLikesTrack.truncate()

      const users = await User.findAll()
      const processUser = async () => {
        let currentUser = users.pop()

        currentUser = await updateAccessToken(currentUser)
        await processTracks(currentUser)
        return users.length > 0 ? processUser() : Promise.resolve()
      }

      return processUser()
    })
  } catch (error) {
    console.error('likedTracks::error =>', error)
    return Promise.reject()
  }
}
