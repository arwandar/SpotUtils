import { isAfter, subWeeks } from 'date-fns'

import { Artist, User, updateAccessToken } from '../sequelize'
import { customAxios, getParams, refillPlaylist } from '../utils'

type SpotifyAlbumSummary = {
  id: string
  available_markets: string[]
  release_date_precision: string
  release_date: string
}

type RadarTrackResult = string[]

const processArtist = async (
  user: User,
  artist: Artist,
  nextUriApi?: string,
  tracks: string[] = []
): Promise<string[]> => {
  const uriApi = nextUriApi || `artists/${artist.id}/albums`

  const {
    data: { items: albums, next },
  } = await customAxios.get(
    uriApi,
    getParams({ limit: 50, include_groups: 'single,album,compilation' }, user, 2)
  )

  for (const album of albums as SpotifyAlbumSummary[]) {
    if (
      album.available_markets.includes('FR') &&
      album.release_date_precision === 'day' &&
      isAfter(new Date(album.release_date), subWeeks(new Date(), 1))
    ) {
      const { data } = await customAxios.get(
        `albums/${album.id}`,
        getParams({ market: 'FR', limit: 50 }, user, 2)
      )

      tracks = [...tracks, ...data.tracks.items.map(({ uri }: { uri: string }) => uri)]
    }
  }

  return next ? processArtist(user, artist, next, tracks) : tracks
}

export default async (): Promise<void> => {
  const artists = await Artist.findAll({
    include: [{ model: User, as: 'followedBy', attributes: ['pseudo'], required: true }],
    order: ['name'],
  })

  const existingUser = await User.findOne()
  if (!existingUser) throw new Error('User not found')

  const user = await updateAccessToken(existingUser, 2)
  let tracks: RadarTrackResult = []

  const processArtists = async (): Promise<void> => {
    const artist = artists.pop()
    if (!artist) return

    const artistTracks = await processArtist(user, artist)
    tracks = [...tracks, ...artistTracks]
    await processArtists()
  }

  await processArtists()

  const users = await User.findAll()
  for (const currentUser of users) {
    if (!currentUser.radarPlaylist) continue
    await refillPlaylist(currentUser, currentUser.radarPlaylist, [...tracks])
  }
}
