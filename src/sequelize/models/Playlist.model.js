import { DataTypes } from 'sequelize'

import sequelize from '../sequelize'

const Playlist = sequelize.define(
  'Playlist',
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
  {}
)

export default Playlist
