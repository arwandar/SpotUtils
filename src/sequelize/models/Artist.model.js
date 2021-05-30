import { DataTypes } from 'sequelize'

import sequelize from '../sequelize'

const Artist = sequelize.define(
  'Artist',
  {
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING(30),
    },
    uri: DataTypes.STRING(50),
    name: DataTypes.TEXT,
  },
  {}
)

export default Artist
