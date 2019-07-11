import Axios from 'axios'
import moment from 'moment'
import storage from 'node-persist'
import qs from 'query-string'
import Random from 'random-js'

const debug = false
const random = new Random(Random.engines.mt19937().autoSeed())

export default class SpotInstance {
  constructor(spotParams: Object, user?: Object = {}) {
    this.user = user
    this.spotParams = spotParams
  }

  refreshAccessToken = (params?: Object): Promise => {
    if (this.user.expires_in && moment(this.user.expires_in).isAfter()) return Promise.resolve()

    return Axios.post(
      'https://accounts.spotify.com/api/token',
      qs.stringify(
        params || {
          grant_type: 'refresh_token',
          refresh_token: this.user.refresh_token,
        }
      ),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${this.spotParams.client_id}:${this.spotParams.client_secret}`
          ).toString('base64')}`,
        },
      }
    )
      .then(({ data }) => {
        console.log('getMe', data)
        this.user.access_token = data.access_token
        this.user.expires_in = moment().add(data.expires_in, 'seconds')
        if (data.refresh_token) this.user.refresh_token = data.refresh_token

        if (!params) return storage.setItem(`user_${this.user.name}`, this.user)
        console.log('new tokens for', this.user.name)
        return Promise.resolve()
      })
      .catch((e) => console.log('Pixelle::SpotInstance.js::27::e =>', e))
  }

  collectSavedTracks = (tracks = [], uri = 'https://api.spotify.com/v1/me/tracks?limit=50') =>
    this.refreshAccessToken()
      .then(() =>
        Axios.get(uri, {
          params: {
            market: this.user.country,
          },
          headers: {
            Authorization: `Bearer ${this.user.access_token}`,
          },
        })
      )
      .then(({ data }) => {
        const nextTracks = [
          ...tracks,
          ...data.items.map(({ track }) => ({
            uri: track.uri,
            id: track.id,
            name: track.name,
            artist_id: track.artists[0].id,
            artist_name: track.artists[0].name,
            album_name: track.album.name,
            is_playable: track.is_playable,
            note: random.integer(0, 10000),
            raw: track,
          })),
        ]
        if (data.next != null && (!debug || tracks.length < 500))
          return this.collectSavedTracks(nextTracks, data.next)
        return Promise.resolve(nextTracks)
      })
      .catch((err) => {
        console.error(`collectSavedTracks ${this.user.name}`, err)
        Promise.reject()
      })

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

  getTracksFronPlaylist = (idPlaylist, offset = 0) =>
    this.refreshAccessToken()
      .then(() =>
        Axios.get(
          `https://api.spotify.com/v1/playlists/${idPlaylist}/tracks?fields=total,items(track(artists(id)))&limit=100&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${this.user.access_token}`,
            },
          }
        )
      )
      .then(({ data }) => {
        const uniq = (a) => [...new Set(a)]

        const artistIds = data.items.reduce(
          (acu, { track }) => [...acu, ...track.artists.map(({ id }) => id)],
          []
        )

        if (data.total > offset + 100) {
          return this.getTracksFronPlaylist(idPlaylist, offset + 100).then((result) =>
            Promise.resolve(uniq(artistIds.concat(result)))
          )
        }
        return Promise.resolve(uniq(artistIds))
      })
      .catch((e) => console.error(e))

  collectFollowedArtists = (
    artists = [],
    url = 'https://api.spotify.com/v1/me/following?type=artist&limit=50'
  ) =>
    this.refreshAccessToken()
      .then(() =>
        Axios.get(url, {
          headers: {
            Authorization: `Bearer ${this.user.access_token}`,
          },
        })
      )
      .then(({ data }) => {
        const nextArtists = [
          ...artists,
          ...data.artists.items.map(({ uri, id, name, genres }) => ({ uri, id, name, genres })),
        ]

        if (data.artists.next != null)
          return this.collectFollowedArtists(nextArtists, data.artists.next)
        return Promise.resolve(nextArtists)
      })
      .catch((err) => {
        console.error(`collectFollowedArtists ${this.user.name}`, err)
        Promise.reject()
      })

  getNewAlbumsFromArtist = (artist) =>
    this.refreshAccessToken()
      .then(() =>
        Axios.get(
          `https://api.spotify.com/v1/search?${qs.stringify({
            market: 'FR',
            type: 'album',
            q: `tag:new artist:${artist.name}`,
          })}`,
          {
            headers: {
              Authorization: `Bearer ${this.user.access_token}`,
            },
          }
        )
      )

      .then(({ data }) => {
        if (data.albums.total === 0) return Promise.resolve([])
        const albumIds = data.albums.items
          .filter((item) => item.artists.some(({ id }) => id === artist.id))
          .map((album) => album.id)
        return Promise.resolve(albumIds)
      })
      .catch((err) => {
        console.error('erreur lors de getNewAlbums', err.toString())
        Promise.reject()
      })

  getNewSongFromArtist = (artist) =>
    this.getNewAlbumsFromArtist(artist)
      .then((albums) => {
        console.log(`albums ${artist.name}`, albums)
        if (albums.length > 0) {
          return Axios.get(
            `https://api.spotify.com/v1/albums?${qs.stringify({
              ids: albums.toString(),
              market: 'FR',
            })}`,
            {
              headers: {
                Authorization: `Bearer ${this.user.access_token}`,
              },
            }
          )
        }
        return Promise.resolve()
      })
      .then((body) => {
        if (!body) return Promise.resolve([])
        return Promise.resolve(
          body.data.albums.reduce(
            (tracks, album) => [
              ...tracks,
              ...album.tracks.items.map(({ uri }) => ({
                uri,
                release_date: album.release_date_precision === 'day' ? album.release_date : false,
              })),
            ],
            []
          )
        )
      })
      .catch(() => Promise.reject)

  getNewSongFromArtists = (artists, tracks = []) =>
    this.getNewSongFromArtist(artists.splice(0, 1)[0])
      .then((result = []) => {
        const nextTracks = [...tracks, ...result]

        if (artists.length > 0) return this.getNewSongFromArtists(artists, nextTracks)
        return Promise.resolve(nextTracks)
      })
      .catch((err) => {
        console.error('erreur lors de getNewSongFromArtists', err)
        Promise.reject()
      })

  cleanTracksForCall = (tracks) =>
    typeof tracks[0] === 'object' ? tracks.map(({ uri }) => uri) : tracks

  addTracksToPlaylist = (idPlaylist, tracks) => {
    if (tracks.length === 0) Promise.resolve()
    const cleanTracks = this.cleanTracksForCall(tracks)

    return Axios.post(
      `https://api.spotify.com/v1/users/${this.user.id}/playlists/${idPlaylist}/tracks`,
      {
        uris: cleanTracks.splice(0, 100),
      },
      {
        headers: {
          Authorization: `Bearer ${this.user.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(() =>
        cleanTracks.length === 0
          ? Promise.resolve()
          : this.addTracksToPlaylist(idPlaylist, cleanTracks)
      )

      .catch((err) => {
        console.error('erreur lors de addTracksToPlaylist', err)
        Promise.reject()
      })
  }

  refillPlaylist = (idPlaylist, tracks) => {
    if (tracks.length === 0) Promise.resolve()
    const cleanTracks = this.cleanTracksForCall(tracks)

    return Axios.put(
      `https://api.spotify.com/v1/users/${this.user.id}/playlists/${idPlaylist}/tracks`,
      {
        uris: cleanTracks.splice(0, 100),
      },
      {
        headers: {
          Authorization: `Bearer ${this.user.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(() =>
        cleanTracks.length === 0
          ? Promise.resolve()
          : this.addTracksToPlaylist(idPlaylist, cleanTracks)
      )
      .catch((err) => {
        console.error('erreur lors de refillPlaylist', err)
        console.log(err)
        Promise.reject()
      })
  }

  putTracksInLibrary = (tracks) => {
    if (tracks.length === 0) Promise.resolve()
    const cleanTracks = this.cleanTracksForCall(tracks)
    return Axios.put(
      `https://api.spotify.com/v1/me/tracks`,
      {
        ids: cleanTracks.splice(0, 50),
      },
      {
        headers: {
          Authorization: `Bearer ${this.user.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(() => this.putTracksInLibrary(cleanTracks))
      .catch(() => {
        console.error('erreur lors de putTracksInLibrary')
        Promise.reject()
      })
  }

  removeTracksFromLibrary = (tracks) => {
    if (tracks.length === 0) Promise.resolve()
    const cleanTracks = this.cleanTracksForCall(tracks)
    return Axios.delete(
      `https://api.spotify.com/v1/me/tracks`,
      {
        ids: cleanTracks.splice(0, 50),
      },
      {
        headers: {
          Authorization: `Bearer ${this.user.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(() => this.removeTracksFromLibrary(cleanTracks))
      .catch((err) => {
        console.error('erreur lors de removeTracksFromLibrary', err)
        Promise.reject()
      })
  }

  generateMyRadar = (idPlaylist: string) =>
    this.collectFollowedArtists()
      .then((artists) => this.getNewSongFromArtists(artists))
      .then(async (tracks = {}) => {
        let oldTracks = await storage.getItem('RadarTracks')
        oldTracks = oldTracks || {}

        const newTracks = Object.values(tracks).filter((track) => {
          if (track.release_date) return moment(track.release_date) > moment().subtract(6, 'days')

          const trackId = track.uri.match(/.*:.*:(\w*)/)[1]
          return !oldTracks.trackId || moment(oldTracks[trackId]) > moment().subtract(6, 'days')
        })

        await storage.setItem(
          'RadarTracks',
          newTracks.reduce((accu, track) => {
            const trackId = track.uri.match(/.*:.*:(\w*)/)[1]
            // eslint-disable-next-line no-param-reassign
            if (!accu.trackId) accu[trackId] = moment().format()
            // eslint-disable-next-line no-param-reassign
            if (track.release_date) accu[trackId] = moment(track.release_date).format()
            return accu
          }, oldTracks)
        )
        return this.refillPlaylist(idPlaylist || this.user.defaultPlaylists.radar, newTracks)
      })

      .catch((err) => {
        console.log('error generateMyRadar', err)
        return Promise.reject()
      })

  generateMyShuffle = (idPlaylist) =>
    this.collectSavedTracks().then((tracks) => {
      tracks.sort((a, b) => b.note - a.note)
      return this.refillPlaylist(idPlaylist || this.user.defaultPlaylists.shuffle, tracks)
    })

  generateMyDoublons = (idPlaylist) =>
    this.collectSavedTracks().then((tracks) => {
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
                  indexOne !== indexTwo && clean(trackOne.name) === clean(trackTwo.name)
              )
            ),
          ],
          []
        )
        .sort((a, b) => (clean(a.name) > clean(b.name) ? 1 : -1))

      return this.refillPlaylist(idPlaylist, result)
    })

  generateSortedShuffle = (tracks: Object, toDeleteArtists) =>
    this.refillPlaylist(
      this.user.defaultPlaylists.shuffleAll,
      Object.values(tracks)
        .filter((track) => !toDeleteArtists.includes(track.artist_id))
        .sort((a, b) => b.note - a.note)
    )
      .then(() => Promise.resolve())
      .catch((err) => {
        console.error('erreur lors de createSortedShuffle', err)
        Promise.reject()
      })

  generateShortSortedShuffle = (tracks: Object, toDeleteArtists) => {
    const tracksTable = Object.values(tracks)
      .filter((track) => !toDeleteArtists.includes(track.artist_id))
      .sort((a, b) => b.note - a.note)

    return this.refillPlaylist(this.user.defaultPlaylists.morningShuffle, tracksTable.slice(-20))
      .then(() =>
        this.refillPlaylist(
          this.user.defaultPlaylists.nightShuffle,
          tracksTable.slice(-40).slice(0, 20)
        )
      )
      .catch((err) => {
        console.error('erreur lors de createSortedShuffle', err)
        Promise.reject()
      })
  }

  //TODO à finir
  generateIndispo = (idPlaylist) => {
    console.log(idPlaylist)
    let toAdd = []
    let toRemove = []
    return this.collectSavedTracks()
      .then((tracks) => {
        const tmpTracks = tracks.filter((track) => track.raw.linked_from)

        toRemove = tmpTracks.map((track) => track.raw.linked_from.id)
        toAdd = tmpTracks.map((track) => track.id)

        return this.removeTracksFromLibrary(toRemove)

        /*return this.refillPlaylist(
          idPlaylist,
          tracks
            .filter((track) => track.raw.linked_from)
            .reduce(
              (accu, track) => [...accu, track.raw.linked_from.uri, track.uri],
              tracks.filter((track) => !track.is_playable).map(({ uri }) => uri)
            )
        )*/
      })
      .then(() => this.putTracksInLibrary(toAdd))
  }
}
