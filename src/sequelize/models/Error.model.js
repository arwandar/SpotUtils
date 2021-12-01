import { DataTypes } from 'sequelize'

import sequelize from '../sequelize'

const Error = sequelize.define(
  'Error',
  {
    id: {
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER,
    },
    code: DataTypes.STRING(4),
    message: DataTypes.TEXT,
    url: DataTypes.TEXT,
    config: DataTypes.TEXT,
  },
  {}
)

export default Error
