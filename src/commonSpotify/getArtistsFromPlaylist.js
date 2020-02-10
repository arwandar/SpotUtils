import Axios from 'axios'

import getUserWithToken from './getUserWithToken'

const getArtistsFromPlaylist = (user: Object, playlistId: string, offset?: Number = 0) =>
  Axios.get(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=total,items(track(artists(id)))&limit=100&offset=${offset}`,
    { headers: { Authorization: `Bearer ${user.access_token}` } }
  )
    .then(({ data }) => {
      const uniq = (a) => [...new Set(a)]

      const artistIds = data.items.reduce(
        (acu, { track }) => [...acu, ...track.artists.map(({ id }) => id)],
        []
      )

      if (data.total > offset + 100) {
        return getArtistsFromPlaylist(user, offset + 100).then((result) =>
          Promise.resolve(uniq(artistIds.concat(result)))
        )
      }
      return Promise.resolve(uniq(artistIds))
    })
    .catch(() => console.log('ERREUR::getArtistsFromPlaylist.js'))

export default (username: String, playlistId: string) =>
  getUserWithToken(username).then((user) => getArtistsFromPlaylist(user, playlistId))
