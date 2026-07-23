import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type NonAttribute, type BelongsToManyAddAssociationMixin } from 'sequelize'

import sequelize from '../sequelize'
import type Artist from './Artist.model'
import type User from './User.model'

class Track extends Model<InferAttributes<Track>, InferCreationAttributes<Track>> {
  declare id: string
  declare uri: CreationOptional<string | null>
  declare name: CreationOptional<string | null>
  declare album_id: CreationOptional<string | null>
  declare album_name: CreationOptional<string | null>
  declare duration_ms: CreationOptional<number | null>
  declare is_playable: CreationOptional<boolean | null>
  declare explicit: CreationOptional<boolean | null>

  declare acousticness: CreationOptional<number | null>
  declare danceability: CreationOptional<number | null>
  declare energy: CreationOptional<number | null>
  declare instrumentalness: CreationOptional<number | null>
  declare liveness: CreationOptional<number | null>
  declare speechiness: CreationOptional<number | null>
  declare tempo: CreationOptional<number | null>
  declare valence: CreationOptional<number | null>

  declare Artists?: NonAttribute<Artist[]>
  declare owner?: NonAttribute<User[]>
  declare excludedBy?: NonAttribute<User[]>

  declare addArtist: BelongsToManyAddAssociationMixin<Artist, string>
  declare addOwner: BelongsToManyAddAssociationMixin<User, string>
  declare addExcludedBy: BelongsToManyAddAssociationMixin<User, string>
}

Track.init(
  {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(30),
    },
    uri: DataTypes.STRING(50),
    name: DataTypes.TEXT,
    album_id: DataTypes.STRING(30),
    album_name: DataTypes.TEXT,
    duration_ms: DataTypes.INTEGER,
    is_playable: DataTypes.BOOLEAN,
    explicit: DataTypes.BOOLEAN,
    acousticness: DataTypes.FLOAT,
    danceability: DataTypes.FLOAT,
    energy: DataTypes.FLOAT,
    instrumentalness: DataTypes.FLOAT,
    liveness: DataTypes.FLOAT,
    speechiness: DataTypes.FLOAT,
    tempo: DataTypes.FLOAT,
    valence: DataTypes.FLOAT,
  },
  { sequelize, modelName: 'Track' }
)

export default Track
