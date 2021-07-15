import cls from 'cls-hooked'
import { Sequelize } from 'sequelize'

import config from '../../config.json'

const namespace = cls.createNamespace('namespace')
Sequelize.useCLS(namespace)

const sequelize = new Sequelize(config.bdd.database, config.bdd.user, config.bdd.password, {
  host: config.bdd.host,
  dialect: 'mariadb',
  logging: false,
})

export default sequelize
