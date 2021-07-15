import querystring from 'querystring'

import config from '../../config.json'
import { getAccessToken1, getAccessToken2 } from '../sequelize'

const scopeArray = [
  'user-follow-modify',
  'ugc-image-upload',
  'user-read-recently-played',
  'user-top-read',
  'app-remote-control',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-modify-playback-state',
  'user-follow-modify',
  'user-read-currently-playing',
  'user-follow-read',
  'user-library-modify',
  'user-read-playback-position',
  'playlist-read-private',
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'playlist-read-collaborative',
  'streaming',
]

const scope = scopeArray.join(' ')

// const scope =
//   'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private streaming user-follow-modify user-follow-read user-library-read user-library-modify user-read-private user-read-birthdate user-read-email user-top-read user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played'

export default (app) => {
  app.get('/login', (req, res) => {
    console.log('/login')

    return res.redirect(
      `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: config.spotify_1.client_id,
        scope,
        redirect_uri: config.spotify_1.redirect_uri,
        state: req.query.pseudo,
      })}`
    )
  })

  app.get(config.spotify_1.endpoint, async (req, res) => {
    await getAccessToken1(req.query.state, req.query.code)

    return res.redirect(
      `https://accounts.spotify.com/authorize?${querystring.stringify({
        response_type: 'code',
        client_id: config.spotify_2.client_id,
        scope:
          'playlist-modify-public playlist-modify-private user-follow-modify user-follow-read user-library-modify',
        redirect_uri: config.spotify_2.redirect_uri,
        state: req.query.state,
      })}`
    )
  })

  app.get(config.spotify_2.endpoint, async (req, res) => {
    await getAccessToken2(req.query.state, req.query.code)

    return res.status(200).send('ok')
  })
}
