import { Model, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '../sequelize'
import Artist from './Artist.model'
import Playlist from './Playlist.model'
import Track from './Track.model'
import User from './User.model'

class UserLikesArtist extends Model<InferAttributes<UserLikesArtist>, InferCreationAttributes<UserLikesArtist>> { }
UserLikesArtist.init({}, { sequelize, tableName: 'User_Likes_Artist' })

class UserDislikesArtist extends Model<InferAttributes<UserDislikesArtist>, InferCreationAttributes<UserDislikesArtist>> { }
UserDislikesArtist.init({}, { sequelize, tableName: 'User_Dislikes_Artist' })

class UserLikesTrack extends Model<InferAttributes<UserLikesTrack>, InferCreationAttributes<UserLikesTrack>> { }
UserLikesTrack.init({}, { sequelize, tableName: 'User_Likes_Track' })

class UserDislikesTrack extends Model<InferAttributes<UserDislikesTrack>, InferCreationAttributes<UserDislikesTrack>> { }
UserDislikesTrack.init({}, { sequelize, tableName: 'User_Dislikes_Track' })

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

Playlist.belongsTo(User, { as: 'owner' })

Playlist.belongsToMany(User, { as: 'filterBy', through: 'Playlist_IsFiltered_By_User' })
User.belongsToMany(Playlist, { as: 'playlists', through: 'Playlist_IsFiltered_By_User' })

export { UserLikesArtist, UserDislikesArtist, UserLikesTrack, UserDislikesTrack }