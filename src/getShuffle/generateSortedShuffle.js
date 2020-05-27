import { MersenneTwister19937, Random } from 'random-js'

import { updateOrderGist } from '../commonLog'
import { getUserWithToken, refillPlaylist } from '../commonSpotify'

const random = new Random(MersenneTwister19937.autoSeed())

const generateSortedShuffle = (
  user: Object,
  tracks: Array = [],
  playlistName: String,
  quantity?: Number
) => {
  console.log(`${playlistName} for ${user.name}`)
  const tracksTable = tracks
    .map((track) => ({ ...track, note: random.integer(0, 10000) }))
    .sort((a, b) => b.note - a.note)
    .splice(0, quantity || tracks.length)

  updateOrderGist(
    `${playlistName}_${user.name}`,
    tracksTable.map((t) => `${t.artist_name} \t ${t.artist_id} \t ${t.name} \t ${t.id}`).join('\n')
  )

  return refillPlaylist(user, user.defaultPlaylists[playlistName], tracksTable)
}

export default (username: String, tracks: Array, playlistName: String, quantity?: Number) =>
  getUserWithToken(username).then((user) =>
    generateSortedShuffle(user, tracks, playlistName, quantity)
  )
