import { MersenneTwister19937, Random } from 'random-js'

import { getArtist, setArtist, setArtistTop } from '../commonBDD/artists'
import {
  Axios,
  gestionErreur,
  getArtistsFromPlaylist,
  getParams,
  getPlaylists,
  getUserWithToken,
  postHeaders,
  refillPlaylist,
} from '../commonSpotify'

const random = new Random(MersenneTwister19937.autoSeed())

const processSource = (user, source, targets) =>
  getArtistsFromPlaylist(user.name, source.id).then((artists) => {
    console.log('top =>', source.name)
    artists.sort((a, b) => a.name.localeCompare(b.name))

    const qt = Number.parseInt(source.name.match(/\[TOP_(\d)\].*/)[1], 10) || 10

    const getTracks = (queue, tracks = []) => {
      if (queue.length === 0) return Promise.resolve(tracks)

      const currentArtist = queue.shift()
      const { id } = currentArtist

      return getArtist(id).then((artist) => {
        const setTopTrack = () =>
          Axios.get(`artists/${id}/top-tracks`, getParams({ country: user.country }, user))
            .then(({ data }) => setArtistTop(id, data.tracks))
            .then((yop) => getTracks(queue, [...tracks, ...yop.slice(0, qt)]))
            .catch((e) => gestionErreur(e, 'getArtistTop'))

        if (!artist) return setArtist(currentArtist).then(setTopTrack)
        if (!artist.top) return setTopTrack()

        return getTracks(queue, [...tracks, ...artist.top.slice(0, qt)])
      })
    }

    return getTracks([...artists]).then((originalTracks) => {
      let tracks = [...originalTracks]
      const targetName = source.name.replace('[TOP_', '[GEN_')
      const target = targets.find((p) => targetName === p.name)

      if (/\[S\]/.test(source.name))
        tracks = tracks
          .map((track) => ({ ...track, note: random.integer(0, 10000) }))
          .sort((a, b) => b.note - a.note)

      return target
        ? refillPlaylist(user, target.id, tracks)
        : Axios.post(`users/${user.id}/playlists`, { name: targetName }, postHeaders(user))
            .then(({ data }) => refillPlaylist(user, data.id, tracks))
            .catch((e) => gestionErreur(e, 'generateTop::process'))
    })
  })

const generateTop = (user: Object) => {
  console.log(`top for ${user.name}`)
  let targets
  return getPlaylists(user.name).then((playlists) => {
    targets = playlists.filter(({ name }) => /\[GEN_\d\].*/.test(name))
    const sources = playlists.filter(({ name }) => /\[TOP_\d\].*/.test(name))

    const recursif = () =>
      sources.length > 0 && processSource(user, sources.pop(), targets).finally(recursif)

    return recursif()
  })
}

export default (username: String) =>
  getUserWithToken(username)
    .then(generateTop)
    .catch(() => {})
