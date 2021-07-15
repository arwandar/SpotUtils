/* eslint-disable no-await-in-loop */
import { isAfter, subWeeks } from 'date-fns'

import { Artist, User, updateAccessToken } from '../sequelize'
import { customAxios, getParams, refillPlaylist } from '../utils'

const processArtist = async (user, artist, nextUriApi, tracks = []) => {
  const uriApi = nextUriApi || `artists/${artist.id}/albums`

  const {
    data: { items: albums, next },
  } = await customAxios.get(
    uriApi,
    getParams({ limit: 50, include_groups: 'single,album,compilation' }, user, 2)
  )

  // eslint-disable-next-line no-restricted-syntax
  for (const album of albums) {
    if (
      album.available_markets.includes('FR') &&
      album.release_date_precision === 'day' &&
      isAfter(new Date(album.release_date), subWeeks(new Date(), 1))
    ) {
      const { data } = await customAxios.get(
        `albums/${album.id}`,
        getParams({ market: 'FR', limit: 50 }, user, 2)
      )
      tracks = [...tracks, ...data.tracks.items.map(({ uri }) => uri)] // eslint-disable-line no-param-reassign
    }
  }

  return next ? processArtist(user, artist, next, tracks) : tracks
}

export default async () => {
  const artists = await Artist.findAll({
    include: [{ model: User, as: 'followedBy', attributes: ['pseudo'], required: true }],
    order: ['name'],
  })

  let user = await User.findOne()
  user = await updateAccessToken(user, 2)
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
    await refillPlaylist(currentUser, currentUser.radarPlaylist, [...tracks])
  }

  return Promise.resolve()
}
