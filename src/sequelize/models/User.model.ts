import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type NonAttribute, type BelongsToManyAddAssociationMixin } from 'sequelize'

import sequelize from '../sequelize'
import type Artist from './Artist.model'
import type Playlist from './Playlist.model'
import type Track from './Track.model'

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare pseudo: string
  declare id: string

  declare refresh_token_1: CreationOptional<string | null>
  declare access_token_1: CreationOptional<string | null>
  declare expires_in_1: CreationOptional<number | null>

  declare refresh_token_2: CreationOptional<string | null>
  declare access_token_2: CreationOptional<string | null>
  declare expires_in_2: CreationOptional<number | null>

  declare excludedTracksPlaylist: CreationOptional<string | null>
  declare excludedArtistsPlaylist: CreationOptional<string | null>
  declare buggyTracksPlaylist: CreationOptional<string | null>
  declare radarPlaylist: CreationOptional<string | null>

  declare likedTracks?: NonAttribute<Track[]>
  declare excludedTracks?: NonAttribute<Track[]>
  declare followedArtists?: NonAttribute<Artist[]>
  declare excludedArtists?: NonAttribute<Artist[]>
  declare playlists?: NonAttribute<Playlist[]>

  declare addLikedTrack: BelongsToManyAddAssociationMixin<Track, string>
  declare addExcludedTrack: BelongsToManyAddAssociationMixin<Track, string>
  declare addFollowedArtist: BelongsToManyAddAssociationMixin<Artist, string>
  declare addExcludedArtist: BelongsToManyAddAssociationMixin<Artist, string>
  declare addPlaylist: BelongsToManyAddAssociationMixin<Playlist, string>
}

User.init(
  {
    pseudo: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(10),
    },
    id: {
      allowNull: false,
      type: DataTypes.STRING(30),
    },

    refresh_token_1: DataTypes.TEXT,
    access_token_1: DataTypes.TEXT,
    expires_in_1: DataTypes.BIGINT,

    refresh_token_2: DataTypes.TEXT,
    access_token_2: DataTypes.TEXT,
    expires_in_2: DataTypes.BIGINT,

    excludedTracksPlaylist: DataTypes.STRING,
    excludedArtistsPlaylist: DataTypes.STRING,
    buggyTracksPlaylist: DataTypes.STRING,
    radarPlaylist: DataTypes.STRING,
  },
  { sequelize, modelName: 'User' }
)

export default User
