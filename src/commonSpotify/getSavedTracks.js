import { updateTracksGist } from '../commonLog'
import getUserWithToken from './getUserWithToken'
import Axios, { gestionErreur, getParams } from './utils'

const debug = false

const getSavedTracks = (user: Object, tracks?: Array = [], uri?: String = 'me/tracks?limit=50') =>
  Axios.get(uri, getParams({ market: user.country }, user))
    .then(({ data }) => {
      const nextTracks = [
        ...tracks,
        ...data.items.map(({ track }) => ({
          uri: (track.linked_from && track.linked_from.uri) || track.uri,
          id: (track.linked_from && track.linked_from.id) || track.id,
          name: track.name,
          artist_id: track.artists[0].id,
          artists_id: track.artists.map((t) => t.id),
          artist_name: track.artists[0].name,
          album_name: track.album.name,
          is_playable: track.is_playable,
          raw: track,
        })),
      ]
      return data.next != null && (!debug || tracks.length < 100)
        ? getSavedTracks(user, nextTracks, data.next)
        : Promise.resolve({ user, savedTracks: nextTracks })
    })
    .catch((e) => gestionErreur(e, `getSavedTracks ${user.name}`))

const formatTrackToString = (t) =>
  [t.raw.artists.map(({ name }) => name).join(', '), t.name, t.album_name, t.id].join('\t')

export default (username: String) =>
  getUserWithToken(username)
    .then(getSavedTracks)
    .then(({ user, savedTracks }) => {
      updateTracksGist(
        `${user.name}`,
        savedTracks
          .map(formatTrackToString)
          .sort((a, b) => a.localeCompare(b))
          .join('\n')
      )

      return savedTracks
    })
