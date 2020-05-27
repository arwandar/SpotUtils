import Axios from 'axios'

import { gestionErreur, postHeaders } from './utils'

const cleanTracksForCall = (tracks) =>
  typeof tracks[0] === 'object' ? tracks.map(({ uri }) => uri) : tracks

const addTracksToPlaylist = (user: Object, idPlaylist: String, tracks: Array) =>
  tracks.length === 0
    ? Promise.resolve()
    : Axios.post(
        `https://api.spotify.com/v1/users/${user.id}/playlists/${idPlaylist}/tracks`,
        { uris: tracks.splice(0, 100) },
        postHeaders(user)
      )
        .then(() => addTracksToPlaylist(user, idPlaylist, tracks))
        .catch((e) => gestionErreur(e, 'addTracksToPlaylist'))

const refillPlaylist = (user: Object, idPlaylist: String, tracks: Array) =>
  Axios.put(
    `https://api.spotify.com/v1/users/${user.id}/playlists/${idPlaylist}/tracks`,
    { uris: tracks.splice(0, 100) },
    postHeaders(user)
  )
    .then(() => addTracksToPlaylist(user, idPlaylist, tracks))
    .catch((e) => gestionErreur(e, 'refillPlaylist'))

export default (user: Object, idPlaylist: String, tracks: Array) =>
  refillPlaylist(user, idPlaylist, cleanTracksForCall(tracks))
