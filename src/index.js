import express from 'express'

import config from '../config.json'
import generateBuggyTracks from './generateBuggyTracks'
import generateShuffle from './generateShuffle'
import { User } from './sequelize'
import exclusions from './updateBddFromSpotify/exclusions'
import likedTracks from './updateBddFromSpotify/likedTracks'

const app = express()
app.get('/api/getTracks', (req, res) => likedTracks().then(() => res.status(200).send('ok')))

app.get('/api/getExclusions', (req, res) => {
  exclusions().then(() => res.status(200).send('ok'))
})

app.get('/api/generateShuffle', async (req, res) => {
  await generateShuffle()
  await generateBuggyTracks()
  return res.status(200).send('ok')
})

app.listen(config.express.port, () => {
  console.log(`App listening to ${config.express.port}....`)
})
