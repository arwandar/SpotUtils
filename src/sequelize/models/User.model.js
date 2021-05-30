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
    refresh_token: {
      allowNull: false,
      type: DataTypes.TEXT,
    },
    access_token: {
      allowNull: false,
      type: DataTypes.TEXT,
    },
    expires_in: DataTypes.BIGINT,
    excludedTracksPlaylist: DataTypes.STRING,
    excludedArtistsPlaylist: DataTypes.STRING,
    buggyTracksPlaylist: DataTypes.STRING,
    radarPlaylist: DataTypes.STRING,
  },
  {}
)

export default User
