import { getUserWithToken, refillPlaylist } from '../commonSpotify'

const addWhiteNoise = (table) => {
  const result = [...table]
  result.push('spotify:track:6H4B9gJD6eQlNoEh8q85pP')
  result.push('spotify:track:3mPuBLqbLyJcATmzbYFKYz')
  result.push('spotify:track:65rkHetZXO6DQmBh3C2YtW')

  return result
}

const clean = (str: string) =>
  str
    .toLowerCase()
    .replace(new RegExp('\\(', 'g'), '')
    .replace(new RegExp('\\)', 'g'), '')
    .replace(new RegExp(' ', 'g'), '')
    .replace(new RegExp('-', 'g'), '')
    .replace(new RegExp('deluxe', 'gi'), '')
    .replace(new RegExp('remastered', 'gi'), '')

const genereateBuggyTracks = (user: Object, tracks: Array) => {
  console.log(`buggyTracks for ${user.name}`)

  let result = []

  // partie avec les linked_from
  tracks
    .filter(({ raw }) => raw.linked_from)
    .forEach((t) => {
      result.push(t.raw.linked_from.uri)
      result.push(t.raw.uri)
    })

  result = addWhiteNoise(result)

  // partie avec les inplayables

  tracks
    .filter(({ raw }) => !raw.is_playable || raw.restrictions)
    .forEach((t) => result.push(t.uri))

  result = addWhiteNoise(result)

  //partie avec les noms en doublons
  // on met toutes les pistes dans un dico, avec en index le noms des artistes
  const dico = {}
  tracks.forEach((t) =>
    t.artists_id.forEach((a) => {
      if (!dico[a]) dico[a] = []
      dico[a].push(t)
    })
  )

  // pour chaque index, on cherche des doublons
  Object.values(dico).forEach((ts) => {
    const tmp = [...ts]
    const toAdd = {}
    while (tmp.length > 1) {
      const first = tmp.shift()
      tmp
        .filter((t) => clean(t.name) === clean(first.name))
        .forEach((t) => {
          toAdd[t.uri] = true
          toAdd[first.uri] = true
        })
    }
    Object.keys(toAdd).forEach((uri) => result.push(uri))
  })

  return refillPlaylist(user, user.defaultPlaylists.buggyTracks, result).catch(() => {
    console.log('ERREUR::genereateBuggyTracks.js')
  })
}

export default (username: String, tracks: Array) =>
  getUserWithToken(username).then((user) => genereateBuggyTracks(user, tracks))
