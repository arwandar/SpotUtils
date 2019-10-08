import express from 'express'

import { initStorage } from './commonBDD'
import { initGist } from './commonLog'
import getRadar from './getRadar'
import getShuffle from './getShuffle'

initStorage()
  .then(initGist)
  .then(() => console.log('INIT FINIE'))

const PORT = 3002
const app = express()

getRadar(app)
getShuffle(app)

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`)
  console.log('Press Ctrl+C to quit.')
})
