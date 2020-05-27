import { getAudioFeatures, getUserWithToken, refillPlaylist } from '../commonSpotify'

const whiteNoise = [
  'spotify:track:6H4B9gJD6eQlNoEh8q85pP',
  'spotify:track:3mPuBLqbLyJcATmzbYFKYz',
  'spotify:track:65rkHetZXO6DQmBh3C2YtW',
]

const genereateBuggyTracks = (user: Object, tracks: Array) => {
  console.log(`buggyTracks for ${user.name}`)

  // partie avec les inplayables, uniquement pour l'user
  const notPlayables = []
  tracks
    .filter(
      ({ raw, owners }) => (!raw.is_playable || raw.restrictions) && owners.includes(user.name)
    )
    .forEach((t) => notPlayables.push(t.uri))

  // partie avec les noms en doublons sur l'ensemble des tracks (pour harmoniser)
  // on met toutes les pistes dans un dico, avec en index le noms des artistes
  const dico = {}
  tracks.forEach((t) =>
    t.artists_id.forEach((a) => {
      if (!dico[a]) dico[a] = []
      dico[a].push(t)
    })
  )

  const duo = []
  // pour chaque index, on cherche des doublons
  Object.values(dico).forEach((ts) => {
    const tmp = [...ts]
    while (tmp.length > 1) {
      const first = tmp.shift()
      tmp
        .filter((t) => t.name.includes(first.name) || first.name.includes(t.name))
        .forEach((t) => {
          duo.push([t.id, first.id])
        })
    }
  })

  return getAudioFeatures(user.name, [...new Set(duo.flat())]).then((audioFeatures) => {
    const afObject = audioFeatures.reduce((obj, af) => ({ ...obj, [af.id]: af }), {})
    const toAdd = new Set()

    const label = [
      'danceability',
      'energy',
      'speechiness',
      'acousticness',
      'instrumentalness',
      'liveness',
      'valence',
    ]
    const getSum = (obj) =>
      label.reduce((sum, key) => sum + obj[key], 0) + obj.tempo / 1000 + obj.duration_ms / 10000

    duo.forEach(
      ([oneId, twoId]) =>
        Math.abs(getSum(afObject[oneId]) - getSum(afObject[twoId])) < 0.1 &&
        toAdd.add(afObject[oneId].uri).add(afObject[twoId].uri)
    )

    return refillPlaylist(user, user.defaultPlaylists.buggyTracks, [
      ...notPlayables,
      ...whiteNoise,
      ...toAdd,
    ]).catch(() => {
      console.log('ERREUR::genereateBuggyTracks.js')
    })
  })
}

export default (username: String, tracks: Array) =>
  getUserWithToken(username).then((user) => genereateBuggyTracks(user, tracks))
