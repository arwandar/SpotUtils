import exclusions from './updateBddFromSpotify/exclusions'
import express from 'express'
import followedArtists from './updateBddFromSpotify/followedArtists'
import generateBuggyTracks from './generateBuggyTracks'
import generateRadar from './generateRadar'
import generateShuffle from './generateShuffle'
import likedTracks from './updateBddFromSpotify/likedTracks'
import login from './login'
import { sequelize } from './sequelize' // eslint-disable-line no-unused-vars

const endpoints = [
  { uri: '/api/getTracks', fct: likedTracks },
  { uri: '/api/getExclusions', fct: exclusions },
  { uri: '/api/generateShuffle', fct: generateShuffle },
  { uri: '/api/generateBuggyTracks', fct: generateBuggyTracks },
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
      return res.status(200).send({ uri })
    } catch (error) {
      console.error(new Date().toISOString(), uri, error)
      return res.status(500).send({
        uri,
        error,
      })
    }
  })
})

login(app)

app.listen(3000, async () => {
  console.log(`App listening to 3000....`)
  try {
    await sequelize.authenticate()
    console.log('Connection to DB has been established successfully.')
  } catch (error) {
    console.error('Unable to connect to the database:', error)
  }
})
