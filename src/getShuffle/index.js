import { getUsernames } from '../commonBDD'
import { updateExclusionGist } from '../commonLog'
import { getSavedTracks } from '../commonSpotify'
import generateBuggyTracks from './generateBuggyTracks'
import generateSortedShuffle from './generateSortedShuffle'
import generateTopFive from './generateTopFive'
import getArtistsFromBlacklist from './getArtistsFromBlacklist'

const filterByUser = (username, t, artistsToDelete) =>
  t.owners.includes(username) ||
  artistsToDelete[username].filter((a) => t.artists_id.includes(a)).length === 0

const formatExclude = (t) => `${t.artist_name} \\ ${t.name} \\ ${t.album_name}`

const processTracks = (data, usernames) => {
  const tracksIndex = {}
  data.forEach((userTracks, index) => {
    userTracks.forEach((track) => {
      if (!tracksIndex[track.id]) tracksIndex[track.id] = { ...track, owners: [usernames[index]] }
      else tracksIndex[track.id].owners.push(usernames[index])
    })
  })
  return Object.values(tracksIndex)
}

const buggyTracks = (usernames, tracks) =>
  Promise.all(
    usernames.map((username) =>
      generateBuggyTracks(
        username,
        Object.values(tracks).filter((t) => t.owners.includes(username))
      )
    )
  )

const reducedShuffle = (tracks, artistsToDelete, playlistName) =>
  generateSortedShuffle(
    'japyx',
    tracks.filter((t) => filterByUser('japyx', t, artistsToDelete)),
    playlistName,
    20
  )

export default (app) => {
  app.get('/api/shuffle', (req, res) => {
    console.log('shuffle')

    let tracks = []
    const artistsToDelete = {}
    let usernames
    const excludes = { Shuffle_all: [] }

    getUsernames()
      .then((result) => {
        usernames = result
        usernames.forEach((username) => {
          excludes[`ShufflePerso_${username}`] = []
        })

        return Promise.all(usernames.map((username) => getSavedTracks(username)))
      })
      .then((data) => {
        console.log('get all tracks ok')
        tracks = processTracks(data, usernames)
        return Promise.all(usernames.map((username) => getArtistsFromBlacklist(username)))
      })
      .then((data) => {
        data.forEach((artist, index) => {
          artistsToDelete[usernames[index]] = artist
        })
        return Promise.all(
          usernames.map((username) =>
            generateSortedShuffle(
              username,
              Object.values(tracks).filter((t) => t.owners.includes(username)),
              'shuffleBiblio'
            )
          )
        )
      })
      .then(() =>
        Promise.all(
          usernames.map((username) =>
            generateSortedShuffle(
              username,
              tracks.filter((t) => {
                if (!filterByUser(username, t, artistsToDelete)) {
                  excludes[`ShufflePerso_${username}`].push(formatExclude(t))
                  return false
                }
                return true
              }),
              'shufflePerso'
            )
          )
        )
      )
      .then(() =>
        generateSortedShuffle(
          'arwy',
          tracks.filter((t) => {
            let toKeep = true
            usernames.forEach((username) => {
              if (!filterByUser(username, t, artistsToDelete)) toKeep = false
            })
            if (!toKeep) excludes.Shuffle_all.push(formatExclude(t))
            return toKeep
          }),
          'shuffleAll'
        )
      )
      .then(() => reducedShuffle(tracks, artistsToDelete, 'morningShuffle'))
      .then(() => reducedShuffle(tracks, artistsToDelete, 'nightShuffle'))
      .then(() => buggyTracks(usernames, tracks))
      .then(() => updateExclusionGist(excludes))
      .then(() => Promise.all(usernames.map((username) => generateTopFive(username))))
      .then(() => res.status(200).send('ok'))
      .catch((err) => console.error('/shuffle', err))
  })
}
