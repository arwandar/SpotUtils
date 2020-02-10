import { getArtistsFromPlaylist, getUserWithToken } from '../commonSpotify'

export default (username: String) =>
  getUserWithToken(username).then((user) =>
    getArtistsFromPlaylist(user, user.defaultPlaylists.blacklist)
  )
