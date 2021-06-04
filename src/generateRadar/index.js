/* eslint-disable no-await-in-loop */
import { isAfter, subWeeks } from 'date-fns'

import { refillPlaylist } from '../../dist/utils/playlist'
import { Artist, User, updateAccessToken } from '../sequelize'
import { customAxios, getParams } from '../utils'

const processArtist = async (user, artist) => {
  const {
    data: { items: albums },
  } = await customAxios.get(`artists/${artist.id}/albums`, getParams({ market: 'FR' }, user))

  let tracks = []
  // eslint-disable-next-line no-restricted-syntax
  for (const album of albums) {
    if (
      album.release_date_precision === 'day' &&
      isAfter(new Date(album.release_date), subWeeks(new Date(), 1))
    ) {
      const { data } = await customAxios.get(
        `albums/${album.id}`,
        getParams({ market: 'FR' }, user)
      )
      tracks = [...tracks, ...data.tracks.items.map(({ uri }) => uri)]
    }
  }

  return tracks
}

export default async () => {
  const artists = await Artist.findAll({
    include: [{ model: User, as: 'followedBy', attributes: ['pseudo'], required: true }],
    order: ['name'],
  })
  let user = await User.findOne()
  user = await updateAccessToken(user)
  let tracks = []

  const processArtists = async () => {
    const artist = artists.pop()
    if (!artist) return Promise.resolve()

    const res = await processArtist(user, artist)
    tracks = [...tracks, ...res]
    return processArtists()
  }

  await processArtists()

  const users = await User.findAll()
  // eslint-disable-next-line no-restricted-syntax
  for (const currentUser of users) {
    await refillPlaylist(currentUser, currentUser.radarPlaylist, tracks)
  }

  return Promise.resolve()
}
