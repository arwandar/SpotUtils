import express from 'express'

import config from '../config.json'
import generateBuggyTracks from './generateBuggyTracks'
import generateRadar from './generateRadar'
import generateShuffle from './generateShuffle'
import login from './login'
import { reinitBdd } from './sequelize' // eslint-disable-line no-unused-vars
import exclusions from './updateBddFromSpotify/exclusions'
import followedArtists from './updateBddFromSpotify/followedArtists'
import likedTracks from './updateBddFromSpotify/likedTracks'

const endpoints = [
  { uri: '/api/getTracks', fct: likedTracks },
  { uri: '/api/getExclusions', fct: exclusions },
  { uri: '/api/generateShuffle', fct: generateShuffle },
  {
    uri: '/api/shuffle',
    fct: async () => {
      await likedTracks()
      await exclusions()
      await generateShuffle()
      return generateBuggyTracks()
    },
  },

  { uri: '/api/getFollowedArtists', fct: followedArtists },
  { uri: '/api/generateRadar', fct: generateRadar },
  {
    uri: '/api/radar',
    fct: async () => {
      await followedArtists()
      return generateRadar()
    },
  },
]

const app = express()

endpoints.forEach(({ uri, fct }) => {
  app.get(uri, async (req, res) => {
    try {
      console.log(uri)
      await fct()
      return res.status(200).send('ok')
    } catch (error) {
      console.error(uri, error)
      return res.status(500).send('ko')
    }
  })
})

login(app)

app.listen(config.express.port, () => {
  console.log(`App listening to ${config.express.port}....`)
})
