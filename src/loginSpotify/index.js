/* 
 finalizeAuthentication = (code, pseudo) =>
    this.refreshAccessToken({
      code,
      redirect_uri: this.spotParams.redirect_uri,
      grant_type: 'authorization_code',
    })
      .then(() =>
        Axios.get('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${this.user.access_token}`,
          },
        })
      )
      .then(({ data }) => {
        console.log('getMe', data)
        this.user.display_name = data.display_name
        this.user.email = data.email
        this.user.id = data.id
        this.user.uri = data.uri
        this.user.country = data.country
        this.user.name = pseudo || data.id
        console.log('user', this.user)
        storage.setItem(`user_${this.user.name}`, this.user)
        Promise.resolve(this.user.name)
      })
      .catch(console.log('finalizeAuthentication'))

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
*/
