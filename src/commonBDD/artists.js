import moment from 'moment'

import { artistsStorage } from './init'

const basicAlbumInfos = ['id', 'name', 'release_date', 'release_date_precision', 'uri']

const getBasicTrack = (track) => ({
  id: track.id,
  name: track.name,
  uri: track.uri,
  album: basicAlbumInfos.reduce((obj, key) => ({ ...obj, [key]: track.album[key] })),
  artist: track.artists.map(({ id, name, uri }) => ({ id, name, uri })),
})

export const getArtist = (id) =>
  artistsStorage.getItem(id).then(
    (artist) =>
      artist && {
        ...artist,
        top:
          artist &&
          artist.lastCheckTop &&
          moment(artist.lastCheckTop).isAfter(moment().subtract(1, 'w'))
            ? artist.top
            : undefined,
        // newTracks:
        //   artist &&
        //   artist.lastCheckNewTracks &&
        //   moment(artist.lastCheckNewTracks).isSame(moment(), 'd') ? artist.newTracks : ,
      }
  )

export const setArtist = (artist) =>
  artistsStorage
    .getItem(artist.id)
    .then((storedArtist) => artistsStorage.setItem(artist.id, { ...storedArtist, ...artist }))

export const setArtistTop = (id, tracks) =>
  artistsStorage
    .getItem(id)
    .then((artist) =>
      artistsStorage.setItem(id, {
        ...artist,
        lastCheckTop: moment(),
        top: tracks.map(getBasicTrack),
      })
    )
    .then(() => tracks)

export const addArtistsTracks = (id, tracks) =>
  artistsStorage.getItem(id).then((artist) =>
    artistsStorage.setItem(id, {
      ...artist,
      lastCheckNewTracks: moment(),
      tracks: [...(artist.tracks || []), ...tracks.map(getBasicTrack)],
    })
  )
