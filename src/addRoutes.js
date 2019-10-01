import storage from 'node-persist'
import qs from 'query-string'

import iniStorage from './iniStorage'
import SpotInstance from './SpotInstance'

export default (app) => {
  iniStorage().then((results) => {
    const { spotInstances, spotParams } = results

    //PROCESSUS DE LOGIN
    app.get('/api/login', (req, res) => {
      console.log('/login')
      console.log('Pixelle::index.js::52::spotParams =>', spotParams)
      const scope =
        'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private streaming user-follow-modify user-follow-read user-library-read user-library-modify user-read-private user-read-birthdate user-read-email user-top-read user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played'
      res.redirect(
        `https://accounts.spotify.com/authorize?${qs.stringify({
          response_type: 'code',
          client_id: spotParams.client_id,
          scope,
          redirect_uri: spotParams.redirect_uri,
          state: req.query.pseudo,
        })}`
      )
    })

    app.get('/api/callback', (req, res) => {
      console.log('/callback')
      const tmpSpotifyInstance = new SpotInstance(spotParams)
      tmpSpotifyInstance
        .finalizeAuthentication(req.query.code, req.query.state)
        .then((userName) => {
          spotInstances[userName] = tmpSpotifyInstance
          res.send('/')
        })
        .catch((err) => {
          console.log('Pixelle::index.js::72::err =>', err)
          res.status(300).send('something went wrong!!')
        })
    })
    // FIN PROCESSUS DE LOGIN

    app.get('/api/shuffleAll', (req, res) => {
      console.log('shuffleAll')

      const tracksIndex = {}
      let artistToDelete = []
      const spotInstancesTable = Object.values(spotInstances).map((user) =>
        user.collectSavedTracks()
      )

      Promise.all(spotInstancesTable)
        .then(async (data) => {
          console.log('get all tracks ok')

          artistToDelete = await storage.getItem('artistToDelete')
          if (!artistToDelete) artistToDelete = ''

          data.forEach((user) => {
            user.forEach((track) => {
              if (!tracksIndex[track.id]) tracksIndex[track.id] = track
            })
          })

          return spotInstances.arwy.getTracksFronPlaylist('41rAa3d9mtEiGnFKdREOuC')
        })
        .then((result) => {
          artistToDelete = result
        })
        // génération des morningShuffle et nightShuffle
        .then(() => spotInstances.japyx.generateShortSortedShuffle(tracksIndex, artistToDelete))
        .then(() => spotInstances.arwy.generateSortedShuffle(tracksIndex, artistToDelete))
        .then(() => res.status(200).send('ok'))
    })

    app.get('/api/shuffle/:user/:playlist?', (req, res) => {
      console.log(`/shuffle ${req.params.user} ${req.params.playlist}`)
      console.log('pixelle', spotInstances)
      spotInstances[req.params.user]
        .generateMyShuffle(req.params.playlist)
        .then(() => {
          console.log('done')
          res.status(200).send('ok')
        })
        .catch((err) => {
          console.error('/shuffle', err)
        })
    })

    app.get('/api/radar/:user/:playlist?', (req, res) => {
      console.log(`/radar ${req.params.user} ${req.params.playlist}`)
      spotInstances[req.params.user]
        .generateMyRadar(req.params.playlist)
        .then(() => res.status(200).send('ok'))
        .catch((err) => console.error('/radar', err))
    })

    app.get('/api/doublons/:user/:playlist', (req, res) => {
      console.log(`/doublons ${req.params.user} ${req.params.playlist}`)
      spotInstances[req.params.user]
        .generateMyDoublons(req.params.playlist)
        .then(() => res.status(200).send('ok'))
        .catch((err) => console.error('/doublons', err))
    })

    app.get('/api/indispo/:user/:playlist', (req, res) => {
      console.log(`/indispo ${req.params.user} ${req.params.playlist}`)
      spotInstances[req.params.user]
        .generateIndispo(req.params.playlist)
        .then(() => res.status(200).send('ok'))
        .catch((err) => console.error('/indispo', err))
    })

    app.get('/api/users', (req, res) => {
      res.status(200).send(spotInstances)
    })
  })
}
