import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, NonAttribute, type BelongsToManyAddAssociationMixin } from 'sequelize'
import sequelize from '../sequelize'
import Track from './Track.model'
import User from './User.model'

class Artist extends Model<InferAttributes<Artist>, InferCreationAttributes<Artist>> {
  declare id: string
  declare uri: CreationOptional<string | null>
  declare name: CreationOptional<string | null>

  declare followedBy?: NonAttribute<User[]>
  declare excludedBy?: NonAttribute<User[]>
  declare tracks?: NonAttribute<Track[]>

  declare addFollowedBy: BelongsToManyAddAssociationMixin<User, string>
  declare addExcludedBy: BelongsToManyAddAssociationMixin<User, string>
}

Artist.init(
  {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(30),
    },
    uri: DataTypes.STRING(50),
    name: DataTypes.TEXT,
  },
  { sequelize, modelName: 'Artist' }
)

export default Artist