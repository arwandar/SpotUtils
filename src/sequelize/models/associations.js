import sequelize from '../sequelize'
import Artist from './Artist.model'
import Playlist from './Playlist.model'
import Track from './Track.model'
import User from './User.model'

const UserLikesArtist = sequelize.define('UserLikesArtist', {}, { tableName: 'User_Likes_Artist' })
const UserDislikesArtist = sequelize.define(
  'UserDislikesArtist',
  {},
  { tableName: 'User_Dislikes_Artist' }
)

const UserLikesTrack = sequelize.define('UserLikesTrack', {}, { tableName: 'User_Likes_Track' })
const UserDislikesTrack = sequelize.define(
  'UserDislikesTrack',
  {},
  { tableName: 'User_Dislikes_Track' }
)

Artist.belongsToMany(Track, { through: 'Track_Artist' })

Artist.belongsToMany(User, { as: 'followedBy', through: UserLikesArtist })
Artist.belongsToMany(User, { as: 'excludedBy', through: UserDislikesArtist })

Track.belongsToMany(Artist, { through: 'Track_Artist' })

Track.belongsToMany(User, { as: 'owner', through: UserLikesTrack })
Track.belongsToMany(User, { as: 'excludedBy', through: UserDislikesTrack })

User.belongsToMany(Track, { as: 'likedTracks', through: UserLikesTrack })
User.belongsToMany(Track, { as: 'excludedTracks', through: UserDislikesTrack })

User.belongsToMany(Artist, { as: 'followedArtists', through: UserLikesArtist })
User.belongsToMany(Artist, { as: 'excludedArtists', through: UserDislikesArtist })

// User.hasMany(Playlist, { as: 'owner' })
Playlist.belongsTo(User, { as: 'owner' })

Playlist.belongsToMany(User, { as: 'filterBy', through: 'Playlist_IsFiltered_By_User' })
User.belongsToMany(Playlist, { as: 'playlists', through: 'Playlist_IsFiltered_By_User' })

export { UserLikesArtist, UserDislikesArtist, UserLikesTrack, UserDislikesTrack }
