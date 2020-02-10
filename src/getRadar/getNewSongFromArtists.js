import Axios from 'axios'
import qs from 'query-string'

import { getUserWithToken } from '../commonSpotify'

const getNewAlbumsFromArtist = (user: Object, artist: Object) =>
  Axios.get(
    `https://api.spotify.com/v1/search?${qs.stringify({
      market: 'FR',
      type: 'album',
      q: `tag:new artist:${artist.name}`,
    })}`,
    { headers: { Authorization: `Bearer ${user.access_token}` } }
  )
    .then(({ data }) => {
      if (data.albums.total === 0) return Promise.resolve([])
      const albumIds = data.albums.items
        .filter((item) => item.artists.some(({ id }) => id === artist.id))
        .map((album) => album.id)

      return Promise.resolve(albumIds)
    })
    .catch(() => console.log('ERREUR::getNewSongFromArtists.js::getNewAlbumsFromArtist'))

const getNewSongFromArtist = (user: Object, artist: Object) =>
  getNewAlbumsFromArtist(user, artist)
    .then((albums) =>
      albums.length > 0
        ? Axios.get(
            `https://api.spotify.com/v1/albums?${qs.stringify({
              ids: albums.toString(),
              market: 'FR',
            })}`,
            { headers: { Authorization: `Bearer ${user.access_token}` } }
          )
        : Promise.resolve({})
    )
    .then(({ data }) =>
      !data
        ? Promise.resolve([])
        : Promise.resolve(
            data.albums.reduce(
              (ts, album) => [
                ...ts,
                ...album.tracks.items.map(({ uri }) => ({
                  uri,
                  release_date: album.release_date_precision === 'day' ? album.release_date : false,
                })),
              ],
              []
            )
          )
    )
    .catch(() => console.log('ERREUR::getNewSongFromArtists.js::getNewSongFromArtist'))

const getNewSongFromArtists = (user: Object, artists: Array, tracks: Array = []) =>
  // TODO rework pour faire un appel getNewSongFromArtisten boucle plutot que sur getNewSongFromArtists
  getNewSongFromArtist(user, artists.splice(0, 1)[0]).then((result = []) => {
    const nextTracks = [...tracks, ...result]
    return artists.length > 0
      ? getNewSongFromArtists(user, artists, nextTracks)
      : Promise.resolve(nextTracks)
  })

export default (username: String, artists: Array) =>
  getUserWithToken(username).then((user) => getNewSongFromArtists(user, artists))
