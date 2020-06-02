import { getUsernames } from '../commonBDD'
import { updateExclusionGist } from '../commonLog'
import { getSavedTracks } from '../commonSpotify'
import generateBuggyTracks from './generateBuggyTracks'
import generateSortedShuffle from './generateSortedShuffle'
import getArtistsFromBlacklist from './getArtistsFromBlacklist'
import getTracksFromBlacklist from './getTracksFromBlacklist'

const filterByUser = (username, t, excludedIds) =>
  t.owners.includes(username) ||
  (!excludedIds[username].tracks.includes(t.id) &&
    !excludedIds[username].artists.some((a) => t.artists_id.includes(a)))

const formatExclude = (t) => `${t.artist_name} \\ ${t.name} \\ ${t.album_name}`

const processTracks = (data) => {
  const tracksIndex = {}
  data.forEach(({ username, value: tracks }) => {
    tracks.forEach((track) => {
      if (!tracksIndex[track.id]) tracksIndex[track.id] = { ...track, owners: [username] }
      else tracksIndex[track.id].owners.push(username)
    })
  })
  return Object.values(tracksIndex)
}

const processAllUsers = (usernames, callback) => {
  const newUsernames = [...usernames]

  const recursif = (res = []) => {
    const username = newUsernames.pop()

    return username
      ? callback(username)
          .then((value) => recursif([...res, { username, value }]))
          .catch(() => recursif(res))
      : Promise.resolve(res)
  }

  return recursif()
}

const reducedShuffle = (tracks, excludedIds, playlistName) =>
  generateSortedShuffle(
    'japyx',
    tracks.filter((t) => filterByUser('japyx', t, excludedIds)),
    playlistName,
    20
  )

export default (app) => {
  app.get('/api/shuffle', (req, res) => {
    console.log('shuffle')

    let tracks = []
    const excludedIds = {}
    let usernames
    const excludedTracks = { Shuffle_all: [] }

    getUsernames()
      .then((result) => {
        usernames = result
        usernames.forEach((username) => {
          excludedTracks[`ShufflePerso_${username}`] = []
          excludedIds[username] = { tracks: [], artists: [] }
        })

        return processAllUsers(usernames, (username) => getSavedTracks(username))
      })
      .then((data) => {
        console.log('get all tracks ok')
        tracks = processTracks(data)
        return processAllUsers(usernames, (username) => getArtistsFromBlacklist(username))
      })
      .then((data) => {
        data.forEach(({ username, value: artists }) => {
          excludedIds[username].artists = artists.map(({ id }) => id)
        })
        return processAllUsers(usernames, (username) => getTracksFromBlacklist(username))
      })
      .then((data) => {
        data.forEach(({ username, value }) => {
          excludedIds[username].tracks = value.map(({ id }) => id)
        })
        return processAllUsers(usernames, (username) =>
          generateSortedShuffle(
            username,
            Object.values(tracks).filter((t) => t.owners.includes(username)),
            'shuffleBiblio'
          )
        )
      })
      .then(() =>
        processAllUsers(usernames, (username) =>
          generateSortedShuffle(
            username,
            tracks.filter((t) => {
              if (!filterByUser(username, t, excludedIds)) {
                excludedTracks[`ShufflePerso_${username}`].push(formatExclude(t))
                return false
              }
              return true
            }),
            'shufflePerso'
          )
        )
      )
      .then(() =>
        generateSortedShuffle(
          'arwy',
          tracks.filter((t) => {
            let toKeep = true
            usernames.forEach((username) => {
              if (!filterByUser(username, t, excludedIds)) toKeep = false
            })
            if (!toKeep) excludedTracks.Shuffle_all.push(formatExclude(t))
            return toKeep
          }),
          'shuffleAll'
        )
      )
      .then(() => reducedShuffle(tracks, excludedIds, 'morningShuffle'))
      .then(() => reducedShuffle(tracks, excludedIds, 'nightShuffle'))
      .then(() =>
        processAllUsers(usernames, (username) =>
          generateBuggyTracks(username, Object.values(tracks))
        )
      )
      .then(() => updateExclusionGist(excludedTracks))
      .then(() => res.status(200).send('ok'))
  })
}
