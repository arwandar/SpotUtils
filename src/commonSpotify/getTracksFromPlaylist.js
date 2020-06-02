import getUserWithToken from './getUserWithToken'
import Axios, { gestionErreur, getHeaders } from './utils'

const getTracksFromPlaylist = (user: Object, uri: string, tracks?: Array<Object> = []) =>
  Axios.get(uri, getHeaders(user))
    .then(({ data }) => {
      const res = [...tracks, ...data.items.map(({ track }) => track)]
      return data.next ? getTracksFromPlaylist(user, data.next, res) : Promise.resolve(res)
    })
    .catch((e) => gestionErreur(e, 'getArtistsFromPlaylist'))

export default (username: String, playlistId: string) =>
  getUserWithToken(username).then((user) =>
    getTracksFromPlaylist(
      user,
      `playlists/${playlistId}/tracks?fields=next%2Citems(track(id,name,uri))&limit=100&offset=0`
    )
  )
