import express from 'express'

import getRadar from './getRadar'
import getShuffle from './getShuffle'

const PORT = 3002
const app = express()

getRadar(app)
getShuffle(app)

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`)
  console.log('Press Ctrl+C to quit.')
})
