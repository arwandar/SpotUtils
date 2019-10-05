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
      const artistsToDelete = {}
      const owners = Object.keys(spotInstances)

      Promise.all(Object.values(owners).map((surname) => spotInstances[surname].collectSavedTracks()))
        .then((data) => {
          console.log('get all tracks ok')

          data.forEach((user, index) => {
            user.forEach((track) => {
              if (!tracksIndex[track.id]) tracksIndex[track.id] = { ...track, owners: [owners[index]] }
              else tracksIndex[track.id].owners.push(owners[index])
            })
          })
          Object.values(tracksIndex)
          return Promise.all(
            Object.values(owners).map((surname) => spotInstances[surname].getArtistsFromBlacklist())
          )
        })
        .then((data) => {
          data.forEach((d, index) => {
            artistsToDelete[owners[index]] = d
          })
          console.log(artistsToDelete)

          //generation des shuffles biblio
          return Promise.all(
            owners.map((surname) =>
              spotInstances[surname].generateSortedShuffle(
                Object.values(tracksIndex).filter(({ owners: o }) => o.includes(surname)),
                'shuffleBiblio'
              )
            )
          )
        })

        .then(() =>
          Promise.all(
            owners.map((surname) =>
              spotInstances[surname].generateSortedShuffle(
                Object.values(tracksIndex).filter((t) => {
                  if (t.uri === 'spotify:track:507bYMYfbm6sUS9iEAaeSd') {
                    console.log(t)
                  }
                  return (
                    t.owners.includes(surname) ||
                    artistsToDelete[surname].filter((a) => t.artists_id.includes(a)).length === 0
                  )

                  // !artistsToDelete[surname].includes(t.artist_id)
                }),
                'shufflePerso'
              )
            )
          )
        )
        .then(() =>
          spotInstances.arwy.generateSortedShuffle(
            Object.values(tracksIndex).filter((t) => {
              let toKeep = true
              Object.keys(artistsToDelete).forEach((surname) => {
                if (
                  !t.owners.includes(surname) &&
                  artistsToDelete[surname].filter((a) => t.artists_id.includes(a)).length === 0
                ) {
                  toKeep = false
                }
              })
              return toKeep
            }),
            'shuffleAll'
          )
        )
        .then(() => res.status(200).send('ok'))
        .catch((err) => console.error('/shuffle', err))
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
