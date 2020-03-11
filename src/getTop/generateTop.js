import Axios from 'axios'
import { MersenneTwister19937, Random } from 'random-js'

import {
  getArtistsFromPlaylist,
  getParams,
  getPlaylists,
  getUserWithToken,
  postHeaders,
  refillPlaylist,
} from '../commonSpotify'

const random = new Random(MersenneTwister19937.autoSeed())

const top = {}
const dico = {}

const getArtistTop = (artists, user) => {
  if (artists.length === 0) return Promise.resolve()

  const id = artists.pop()

  return Axios.get(
    `https://api.spotify.com/v1/artists/${id}/top-tracks`,
    getParams({ country: user.country }, user)
  )
    .then(({ data }) => {
      top[id] = data.tracks.map((track) => track.uri)
      return getArtistTop(artists, user)
    })
    .catch((e) => console.log('ERREUR::getArtistTop.js::e =>', e))
}

const getArtistsName = (artists, user) =>
  artists.length === 0
    ? Promise.resolve()
    : Axios.get(
        'https://api.spotify.com/v1/artists',
        getParams({ ids: artists.splice(0, 50).toString() }, user)
      )
        .then(({ data }) => {
          data.artists.forEach((artist) => {
            dico[artist.id] = artist.name
          })
          return getArtistsName(artists, user)
        })
        .catch((e) => console.log('ERREUR::getArtistsName.js::e =>', e))

const process = (playlistsSources, user, playlistsTarget) => {
  const artists = playlistsSources.reduce((accu, { artists: a }) => [...accu, ...a], [])
  const topArtists = artists.filter((id) => !dico[id])
  const nameArtists = artists.filter((id) => !top[id])
  return getArtistTop(topArtists, user)
    .then(() => getArtistsName(nameArtists, user))
    .then(() => {
      playlistsSources.forEach((pS) => {
        let tracks = pS.artists
          .sort((a, b) => dico[a].localeCompare(dico[b]))
          .map((a) => top[a].slice(0, pS.qt))
          .flat()
        const targetName = pS.name.replace('[TOP_', '[GEN_')
        const pT = playlistsTarget.find((p) => targetName === p.name)

        if (/[S]/.test(pS.name))
          tracks = tracks
            .map((track) => ({ uri: track, note: random.integer(0, 10000) }))
            .sort((a, b) => b.note - a.note)

        return pT
          ? refillPlaylist(user, pT.id, tracks)
          : Axios.post(
              `https://api.spotify.com/v1/users/${user.id}/playlists`,
              { name: targetName },
              postHeaders(user)
            ).then(({ data }) => refillPlaylist(user, data.id, tracks))
      })
    })
}

const generateTop = (user: Object) => {
  console.log(`top for ${user.name}`)
  let playlistsTarget
  return getPlaylists(user.name)
    .then((res) => {
      playlistsTarget = res.filter(({ name }) => /\[GEN_\d\].*/.test(name))

      return Promise.all(
        res
          .filter(({ name }) => /\[TOP_\d\].*/.test(name))
          .map(({ id, name }) =>
            getArtistsFromPlaylist(user.name, id).then((artists) => {
              const qt = Number.parseInt(name.match(/\[TOP_(\d)\].*/)[1], 10)
              return { artists, id, name, qt: qt || 10 }
            })
          )
      )
    })
    .then((res) => (res.length > 0 ? process(res, user, playlistsTarget) : Promise.resolve()))
}

export default (username: String) => getUserWithToken(username).then(generateTop)
