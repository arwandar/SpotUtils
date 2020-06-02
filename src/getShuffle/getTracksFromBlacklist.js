import { getTracksFromPlaylist, getUserWithToken } from '../commonSpotify'

export default (username: String) =>
  getUserWithToken(username).then((user) =>
    getTracksFromPlaylist(user.name, user.defaultPlaylists.blacklist.tracks)
  )
