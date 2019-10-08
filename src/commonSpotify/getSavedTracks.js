import Axios from 'axios'

import getUserWithToken from './getUserWithToken'

const debug = false

const getSavedTracks = (
  user: Object,
  tracks?: Array = [],
  uri?: String = 'https://api.spotify.com/v1/me/tracks?limit=50'
) =>
  Axios.get(uri, {
    params: { market: user.country },
    headers: { Authorization: `Bearer ${user.access_token}` },
  })
    .then(({ data }) => {
      const nextTracks = [
        ...tracks,
        ...data.items.map(({ track }) => ({
          uri: track.uri,
          id: track.id,
          name: track.name,
          artist_id: track.artists[0].id,
          artists_id: track.artists.map((t) => t.id),
          artist_name: track.artists[0].name,
          album_name: track.album.name,
          is_playable: track.is_playable,
          raw: track,
        })),
      ]
      return data.next != null && (!debug || tracks.length < 200)
        ? getSavedTracks(user, nextTracks, data.next)
        : Promise.resolve(nextTracks)
    })
    .catch(() => {
      console.log('ERREUR::getSavedTracks.js::33')
    })

export default (username: String) => getUserWithToken(username).then(getSavedTracks)
