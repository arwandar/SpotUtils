/* 
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
generateMyDoublons = (idPlaylist) =>
    this.collectSavedTracks()
      .then((tracks) => {
        const artistsIndex = {}
        tracks.forEach((track) => {
          if (!artistsIndex[track.artist_id]) {
            artistsIndex[track.artist_id] = {
              name: track.artist_name,
              tracks: [],
            }
          }
          artistsIndex[track.artist_id].tracks.push(track)
        })

        const clean = (str: string) =>
          str
            .toLowerCase()
            .replace(new RegExp('\\(', 'g'), '')
            .replace(new RegExp('\\)', 'g'), '')
            .replace(new RegExp(' ', 'g'), '')
            .replace(new RegExp('-', 'g'), '')
            .replace(new RegExp('deluxe', 'g'), '')
            .replace(new RegExp('remastered', 'g'), '')

        const result = Object.values(artistsIndex)
          .reduce(
            (accu, artist) => [
              ...accu,
              ...artist.tracks.filter((trackOne, indexOne) =>
                artist.tracks.some(
                  (trackTwo, indexTwo) =>
                    indexOne !== indexTwo &&
                    clean(trackOne.name) === clean(trackTwo.name) &&
                    trackOne.id !== trackTwo.id
                )
              ),
            ],
            []
          )
          .sort((a, b) => (clean(a.name) > clean(b.name) ? 1 : -1))
        console.log(result)
        return this.refillPlaylist(idPlaylist, result)
      })
      .catch(() => console.log('generateMyDoublons'))
 generateIndispo = (idPlaylist) =>
    this.collectSavedTracks()
      .then((tracks) => {
        return this.refillPlaylist(
          idPlaylist,
          tracks
            .filter((track) => track.raw.linked_from)
            .reduce(
              (accu, track) => [...accu, track.raw.linked_from.uri, track.uri],
              tracks.filter((track) => !track.is_playable).map(({ uri }) => uri)
            )
        )
      })
      .catch(() => console.log('generateIndispo'))
*/
