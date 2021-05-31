import express from 'express'

import config from '../config.json'
import generateBuggyTracks from './generateBuggyTracks'
import generateShuffle from './generateShuffle'
import exclusions from './updateBddFromSpotify/exclusions'
import likedTracks from './updateBddFromSpotify/likedTracks'

const app = express()

app.get('/api/shuffle', async (req, res) => {
  try {
    await likedTracks()
    await exclusions()

    await generateShuffle()
    await generateBuggyTracks()
  } catch (error) {
    console.error('generateShuffle ', error)
  }
  return res.status(200).send('ok')
})

app.listen(config.express.port, () => {
  console.log(`App listening to ${config.express.port}....`)
})
