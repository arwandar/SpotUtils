import { Sequelize } from 'sequelize'
import cls from 'cls-hooked'

const namespace = cls.createNamespace('namespace')
Sequelize.useCLS(namespace)

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  logging: false,
})

export default sequelize
