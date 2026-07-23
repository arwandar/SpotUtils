import { Artist, Playlist, Track, User, sequelize } from '../sequelize'
import { refillPlaylist } from '../utils'

const process = async (playlist: Playlist) => {
  const tracks = await Track.findAll({
    attributes: ['id', 'uri', 'name'],
    order: [sequelize.random()],
    include: [
      { model: User, as: 'owner', attributes: ['pseudo'] },
      { model: Artist, attributes: ['id'] },
    ],
  })

  let reducedTracks: string[] = tracks.reduce<string[]>((list, track) => {
    const trackOwners = track.owner ?? []
    const trackArtists = track.Artists ?? []
    const filterUsers = playlist.filterBy ?? []
    const shouldExclude =
      (playlist.use_all_library && trackOwners.length === 0) ||
      (!playlist.use_all_library &&
        !trackOwners.some(({ pseudo }) => pseudo === playlist.owner?.pseudo)) ||
      filterUsers.some(
        (user) =>
          (user.excludedTracks ?? []).some(({ id }) => id === track.id) ||
          (user.excludedArtists ?? []).some(({ id }) =>
            trackArtists.some((artist) => artist.id === id)
          )
      )

    return shouldExclude || !track.uri ? list : [...list, track.uri]
  }, [])

  if (playlist.quantity) reducedTracks = reducedTracks.slice(0, playlist.quantity)

  return refillPlaylist(playlist.owner as User, playlist.id, reducedTracks)
}

export default async () => {
  const playlists = await Playlist.findAll({
    include: [
      { model: User, as: 'owner' },
      {
        model: User,
        as: 'filterBy',
        attributes: ['pseudo'],
        include: [
          { model: Track, as: 'excludedTracks', attributes: ['id'] },
          { model: Artist, as: 'excludedArtists', attributes: ['id'] },
        ],
      },
    ],
  })

  const processPlaylists = async () => {
    const playlist = playlists.pop()
    if (!playlist) return Promise.resolve()
    await process(playlist)

    return processPlaylists()
  }

  await processPlaylists()
}
