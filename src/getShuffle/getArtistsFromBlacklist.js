import Axios from 'axios'

import { getUserWithToken } from '../commonSpotify'

const getArtistsFromBlacklist = (user: Object, offset?: Number = 0) =>
  Axios.get(
    `https://api.spotify.com/v1/playlists/${user.defaultPlaylists.blacklist}/tracks?fields=total,items(track(artists(id)))&limit=100&offset=${offset}`,
    { headers: { Authorization: `Bearer ${user.access_token}` } }
  )
    .then(({ data }) => {
      const uniq = (a) => [...new Set(a)]

      const artistIds = data.items.reduce(
        (acu, { track }) => [...acu, ...track.artists.map(({ id }) => id)],
        []
      )

      if (data.total > offset + 100) {
        return getArtistsFromBlacklist(user, offset + 100).then((result) =>
          Promise.resolve(uniq(artistIds.concat(result)))
        )
      }
      return Promise.resolve(uniq(artistIds))
    })
    .catch(() => console.log('ERREUR::getArtistsFromBlacklist.js'))

export default (username: String) => getUserWithToken(username).then(getArtistsFromBlacklist)
