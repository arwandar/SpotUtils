import { Axios, gestionErreur, getHeaders, getUserWithToken } from '../commonSpotify'

const getFollowedArtists = (
  user: Object,
  artists: Array = [],
  url: String = 'me/following?type=artist&limit=50'
) =>
  Axios.get(url, getHeaders(user))
    .then(({ data }) => {
      const nextArtists = [
        ...artists,
        ...data.artists.items.map(({ uri, id, name, genres }) => ({ uri, id, name, genres })),
      ]

      if (data.artists.next != null) return getFollowedArtists(user, nextArtists, data.artists.next)
      return Promise.resolve(nextArtists)
    })
    .catch((e) => gestionErreur(e, 'getFollowedArtists'))

export default (username: String) => getUserWithToken(username).then(getFollowedArtists)
