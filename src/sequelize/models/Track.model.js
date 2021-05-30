import { DataTypes } from 'sequelize'

import sequelize from '../sequelize'

const Track = sequelize.define(
  'Track',
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
  {}
)

export default Track
