import Playlist from '../models/Playlist.model'
import User from '../models/User.model'
import sequelize from '../sequelize'

const users = require('../../../users.json')
const playlists = require('../../../playlists.json')

export default async () => {
  await sequelize.drop()
  await sequelize.sync({ force: true })

  if (users && playlists) {
    await User.bulkCreate(users)
    await Playlist.bulkCreate(playlists)
  }
}
