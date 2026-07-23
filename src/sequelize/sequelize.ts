import { Sequelize } from 'sequelize'
import cls from 'cls-hooked'
import fs from 'fs'

const namespace = cls.createNamespace('namespace')
Sequelize.useCLS(namespace)

const password = fs.readFileSync(process.env.DB_PASSWORD_SECRET as string, 'utf8').trim()

const sequelize = new Sequelize(process.env.DB_NAME as string, process.env.DB_USER as string, password, {
  host: process.env.DB_HOST as string,
  dialect: 'mariadb',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  port: process.env.DB_PORT as unknown as number || 3306,

})

export default sequelize
