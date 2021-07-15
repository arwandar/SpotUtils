import { DataTypes } from 'sequelize'

import sequelize from '../sequelize'

const User = sequelize.define(
  'User',
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
  {}
)

export default User
