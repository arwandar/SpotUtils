import Axios from 'axios'

import {
  getArtistsFromPlaylist,
  getPlaylists,
  getUserWithToken,
  refillPlaylist,
} from '../commonSpotify'

const top = {}
const dico = {}

const getHeaders = (user) => ({ headers: { Authorization: `Bearer ${user.access_token}` } })

const getArtistTop = (artists, user) => {
  const id = artists.pop()
  if (!top[id]) {
    return Axios.get(`https://api.spotify.com/v1/artists/${id}/top-tracks`, {
      params: { country: user.country },
      ...getHeaders(user),
    })
      .then(({ data }) => {
        top[id] = data.tracks.map((track) => track.uri)
        return Axios.get(`https://api.spotify.com/v1/artists/${id}`, getHeaders(user))
      })
      .then(({ data }) => {
        dico[id] = data.name
        return artists.length > 0 ? getArtistTop(artists, user) : Promise.resolve()
      })
      .catch((e) => console.log('Pixelle::generateTopFive.js::36::e =>', e))
  }
  return artists.length > 0 ? getArtistTop(artists, user) : Promise.resolve()
}

const generateTopFive = (user: Object) => {
  console.log(`topFive for ${user.name}`)
  let playlistsSources
  let playlistsTarget
  getPlaylists(user.name)
    .then((res) => {
      playlistsTarget = res.filter(({ name }) => /\[GEN_5\].*/.test(name))

      return Promise.all(
        res
          .filter(({ name }) => /\[TOP_5\].*/.test(name))
          .map((playlist) =>
            getArtistsFromPlaylist(user.name, playlist.id).then((artists) => ({
              artists,
              ...playlist,
            }))
          )
      )
    })
    .then((res) => {
      playlistsSources = [...res]
      return getArtistTop(
        res.reduce((accu, { artists: a }) => [...accu, ...a], []),
        user
      )
    })
    .then(() => {
      console.log('Pixelle::generateTopFive.js::60::topFive =>', top)
      playlistsSources.forEach((pS) => {
        const tracks = pS.artists
          .sort((a, b) => dico[a].localeCompare(dico[b]))
          .map((a) => top[a])
          .flat()
        console.log('Pixelle::generateTopFive.js::56::tracks =>', tracks)

        const pT = playlistsTarget.find((p) => pS.name.replace('[TOP_5]', '[GEN_5]') === p.name)

        if (!pT) {
          return Axios.post(
            `https://api.spotify.com/v1/users/${user.id}/playlists`,
            { name: pS.name.replace('[TOP_5]', '[GEN_5]') },
            {
              headers: {
                Authorization: `Bearer ${user.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          ).then(({ data }) => refillPlaylist(user, data.id, tracks))
        }
        return refillPlaylist(user, pT.id, tracks)
      })
    })
}

export default (username: String) =>
  getUserWithToken(username).then((user) => generateTopFive(user))
