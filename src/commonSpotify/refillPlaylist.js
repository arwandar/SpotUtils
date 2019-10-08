import Axios from 'axios'

const cleanTracksForCall = (tracks) =>
  typeof tracks[0] === 'object' ? tracks.map(({ uri }) => uri) : tracks

const getHeaders = (user) => ({
  headers: {
    Authorization: `Bearer ${user.access_token}`,
    'Content-Type': 'application/json',
  },
})

const addTracksToPlaylist = (user: Object, idPlaylist: String, tracks: Array) =>
  tracks.length === 0
    ? Promise.resolve()
    : Axios.post(
        `https://api.spotify.com/v1/users/${user.id}/playlists/${idPlaylist}/tracks`,
        { uris: tracks.splice(0, 100) },
        getHeaders(user)
      )
        .then(() => addTracksToPlaylist(user, idPlaylist, tracks))
        .catch(() => console.log('ERREUR::refillPlaylist.js::addTracksToPlaylist'))

const refillPlaylist = (user: Object, idPlaylist: String, tracks: Array) =>
  tracks.length === 0
    ? Promise.resolve()
    : Axios.put(
        `https://api.spotify.com/v1/users/${user.id}/playlists/${idPlaylist}/tracks`,
        { uris: tracks.splice(0, 100) },
        getHeaders(user)
      )
        .then(() => addTracksToPlaylist(user, idPlaylist, tracks))
        .catch(() => console.log('ERREUR::refillPlaylist.js::refillPlaylist'))

export default (user: Object, idPlaylist: String, tracks: Array) =>
  refillPlaylist(user, idPlaylist, cleanTracksForCall(tracks))
