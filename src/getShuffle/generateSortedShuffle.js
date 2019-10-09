import { MersenneTwister19937, Random } from 'random-js'

import { getUserWithToken, refillPlaylist } from '../commonSpotify'

const random = new Random(MersenneTwister19937.autoSeed())

const generateSortedShuffle = (
  user: Object,
  tracks: Array,
  playlistName: String,
  quantity?: Number
) => {
  console.log(playlistName)
  const tracksTable = tracks
    .map((track) => ({ ...track, note: random.integer(0, 10000) }))
    .sort((a, b) => b.note - a.note)
    .splice(0, quantity || tracks.length)

  return refillPlaylist(user, user.defaultPlaylists[playlistName], tracksTable).catch(() => {
    console.log('ERREUR::generateSortedShuffle.js')
  })
}

export default (username: String, tracks: Array, playlistName: String, quantity?: Number) =>
  getUserWithToken(username).then((user) =>
    generateSortedShuffle(user, tracks, playlistName, quantity)
  )
