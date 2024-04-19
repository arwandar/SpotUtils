import { Sequelize } from 'sequelize'
import cls from 'cls-hooked'
import fs from 'fs'

const namespace = cls.createNamespace('namespace')
Sequelize.useCLS(namespace)

const password = fs.readFileSync(process.env.DB_PASSWORD_SECRET, 'utf8').trim()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, password, {
  host: process.env.DB_HOST,
  dialect: 'mariadb',
  logging: false,
})

export default sequelize
