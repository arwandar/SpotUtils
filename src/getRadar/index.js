import moment from 'moment'

import { addArtistsTracks, getArtist, getUser, setArtist } from '../commonBDD'
import { Axios, gestionErreur, getParams, refillPlaylist } from '../commonSpotify'
import getFollowedArtists from './getFollowedArtists'

const getNewAlbumIds = (user, artist) =>
  Axios.get(
    'search',
    getParams({ market: 'FR', type: 'album', q: `tag:new artist:${artist.name}` }, user)
  )
    .then(({ data }) => {
      if (data.albums.total === 0) return Promise.resolve([])
      const albumIds = data.albums.items
        .filter((item) => item.artists.some(({ id }) => id === artist.id))
        .map((album) => album.id)

      return Promise.resolve(albumIds)
    })

    .catch((e) => gestionErreur(e, 'getNewAlbumsFromArtist'))

const getTracks = (user, queue, tracks = []) => {
  if (queue.length === 0) return Promise.resolve(tracks)

  const currentArtist = queue.shift()
  const { id } = currentArtist

  return getArtist(id).then((artist) => {
    const filterTracks = (toFilter) =>
      toFilter.filter((track) =>
        moment(track.album.release_date).isAfter(moment().subtract(1, 'w'))
      )

    const setNewTracks = () =>
      getNewAlbumIds(user, currentArtist)
        .then((albums) =>
          albums.length > 0
            ? Axios.get('albums', getParams({ ids: albums.toString(), market: 'FR' }, user))
            : Promise.resolve({})
        )
        .then(({ data }) => {
          if (!data) return addArtistsTracks(currentArtist.id, [])
          return addArtistsTracks(
            currentArtist.id,
            data.albums.reduce(
              (accu, album) => [
                ...accu,
                ...album.tracks.items.map((track) => ({
                  ...track,
                  album: {
                    id: album.id,
                    name: album.name,
                    release_date: album.release_date,
                    release_date_precision: album.release_date_precision,
                    uri: album.uri,
                  },
                })),
              ],
              []
            )
          )
        })
        .then(() => getArtist(id))
        .then((storedArtist) =>
          getTracks(user, queue, [...tracks, ...filterTracks(storedArtist.tracks)])
        )

    if (!artist || !artist.lastCheckNewTracks) return setArtist(currentArtist).then(setNewTracks)
    if (!moment(artist.lastCheckNewTracks).isSame(moment(), 'd')) return setNewTracks()
    return getTracks(user, queue, [...tracks, ...filterTracks(artist.tracks)])
  })
}

export default (app) => {
  app.get('/api/radar/:user', (req, res) => {
    console.log(`/radar ${req.params.user}`)
    let user

    getUser(req.params.user)
      .then((storedUser) => {
        user = storedUser
        return getFollowedArtists(user.name)
      })
      .then((artists) => getTracks(user, artists))
      .then((newTracks) => refillPlaylist(user, user.defaultPlaylists.radar, newTracks))
      .then(() => res.status(200).send('ok'))
  })
}
