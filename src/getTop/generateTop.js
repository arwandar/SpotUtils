import Axios from 'axios'

import {
  getArtistsFromPlaylist,
  getParams,
  getPlaylists,
  getUserWithToken,
  postHeaders,
  refillPlaylist,
} from '../commonSpotify'

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
        const tracks = pS.artists
          .sort((a, b) => dico[a].localeCompare(dico[b]))
          .map((a) => top[a])
          .flat()
        const targetName = pS.name.replace('[TOP_5]', '[GEN_5]')
        const pT = playlistsTarget.find((p) => targetName === p.name)

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

const generateTopFive = (user: Object) => {
  console.log(`topFive for ${user.name}`)
  let playlistsTarget
  return getPlaylists(user.name)
    .then((res) => {
      playlistsTarget = res.filter(({ name }) => /\[GEN_5\].*/.test(name))

      return Promise.all(
        res
          .filter(({ name }) => /\[TOP_5\].*/.test(name))
          .map(({ id, name }) =>
            getArtistsFromPlaylist(user.name, id).then((artists) => ({ artists, id, name }))
          )
      )
    })
    .then((res) => (res.length > 0 ? process(res, user, playlistsTarget) : Promise.resolve()))
}

export default (username: String) => getUserWithToken(username).then(generateTopFive)
