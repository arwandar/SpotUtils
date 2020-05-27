import Axios from 'axios'

import getUserWithToken from './getUserWithToken'
import { gestionErreur, getHeaders } from './utils'

const getArtistsFromPlaylist = (user: Object, uri: string, artists?: Array<string> = []) =>
  Axios.get(uri, getHeaders(user))
    .then(({ data }) => {
      const artistIds = data.items.reduce(
        (acu, { track }) => [...acu, ...track.artists.map(({ id }) => id)],
        artists
      )

      return data.next
        ? getArtistsFromPlaylist(user, data.next, artistIds)
        : Promise.resolve([...new Set(artistIds)])
    })
    .catch((e) => gestionErreur(e, 'getArtistsFromPlaylist'))

export default (username: String, playlistId: string) =>
  getUserWithToken(username).then((user) =>
    getArtistsFromPlaylist(
      user,
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?fields=next%2Citems(track(artists(id)))&limit=100&offset=0`
    )
  )
