import getUserWithToken from './getUserWithToken'
import Axios, { gestionErreur, getHeaders } from './utils'

const clean = (artists) => {
  const uniqIds = new Set()
  return artists.reduce((res, artist) => {
    if (!uniqIds.has(artist.id)) {
      uniqIds.add(artist.id)
      res.push(artist)
    }
    return res
  }, [])
}

const getArtistsFromPlaylist = (user: Object, uri: string, artists?: Array<Object> = []) =>
  Axios.get(uri, getHeaders(user))
    .then(({ data }) => {
      const res = [...artists, ...data.items.map(({ track }) => track.artists).flat()]
      return data.next ? getArtistsFromPlaylist(user, data.next, res) : Promise.resolve(clean(res))
    })
    .catch((e) => gestionErreur(e, 'getArtistsFromPlaylist'))

export default (username: String, playlistId: string) =>
  getUserWithToken(username).then((user) =>
    getArtistsFromPlaylist(
      user,
      `playlists/${playlistId}/tracks?fields=next%2Citems(track(artists))&limit=100&offset=0`
    )
  )
