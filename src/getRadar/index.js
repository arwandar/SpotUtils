import moment from 'moment'

import { getOldTracks, getUser, setOldTracks } from '../commonBDD'
import { refillPlaylist } from '../commonSpotify'
import getFollowedArtists from './getFollowedArtists'
import getNewSongFromArtists from './getNewSongFromArtists'

export default (app) => {
  app.get('/api/radar/:user', (req, res) => {
    console.log(`/radar ${req.params.user}`)

    let tracks
    let newTracks

    getFollowedArtists(req.params.user)
      .then((artists) => getNewSongFromArtists(req.params.user, artists))
      .then((ts: Array) => {
        tracks = ts
        return getOldTracks()
      })
      .then((oTs) => {
        const oldTracks = oTs || {}

        newTracks = Object.values(tracks).filter((track) => {
          if (track.release_date)
            return moment(track.release_date).isAfter(moment().subtract(6, 'days'))
          const trackId = track.uri.match(/.*:.*:(\w*)/)[1]
          return (
            !oldTracks.trackId || moment(oldTracks[trackId]).isAfter(moment().subtract(6, 'days'))
          )
        })

        return setOldTracks(
          newTracks.reduce((accu, track) => {
            const trackId = track.uri.match(/.*:.*:(\w*)/)[1]
            const newAccu = { ...accu }
            if (!newAccu.trackId) newAccu[trackId] = moment().format()
            if (track.release_date) newAccu[trackId] = moment(track.release_date).format()
            return newAccu
          }, oldTracks)
        )
      })
      .then(() => getUser(req.params.user))
      .then((user) => refillPlaylist(user, user.defaultPlaylists.radar, newTracks))
      .then(() => res.status(200).send('ok'))
      .catch((err) => console.error('/radar', err))
  })
}
