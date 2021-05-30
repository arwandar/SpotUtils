import sequelize from '../sequelize'

export default async () => {
  await sequelize.drop()
  await sequelize.sync({ force: true })
}
