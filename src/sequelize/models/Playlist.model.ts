import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type NonAttribute, type BelongsToSetAssociationMixin } from 'sequelize'

import sequelize from '../sequelize'
import type User from './User.model'

class Playlist extends Model<InferAttributes<Playlist>, InferCreationAttributes<Playlist>> {
  declare id: string
  declare name: CreationOptional<string | null>
  declare quantity: CreationOptional<number | null>
  declare use_all_library: CreationOptional<boolean | null>

  declare owner?: NonAttribute<User>
  declare filterBy?: NonAttribute<User[]>

  declare setOwner: BelongsToSetAssociationMixin<User, string>
}

Playlist.init(
  {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(30),
    },
    name: DataTypes.TEXT,
    quantity: DataTypes.INTEGER,
    use_all_library: {
      allowNull: true,
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  { sequelize, modelName: 'Playlist' }
)

export default Playlist
