import Axios from 'axios'

import getUserWithToken from './getUserWithToken'

const debug = false

const getPlaylists = (
  user: Object,
  playlists?: Array = [],
  uri?: String = 'https://api.spotify.com/v1/me/playlists?limit=50'
) =>
  Axios.get(uri, {
    params: { market: user.country },
    headers: { Authorization: `Bearer ${user.access_token}` },
  })
    .then(({ data }) => {
      const nextPlaylists = [
        ...playlists,
        ...data.items
          .filter(({ owner }) => owner.id === user.id)
          .map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            raw: playlist,
          })),
      ]
      return data.next != null && (!debug || playlists.length < 200)
        ? getPlaylists(user, nextPlaylists, data.next)
        : Promise.resolve(nextPlaylists)
    })
    .catch((erreur) => {
      console.log('ERREUR::getPlaylists.js::33', erreur)
    })

export default (username: String) => getUserWithToken(username).then(getPlaylists)
