import express from 'express'

import { initStorage, setIftttUser } from './commonBDD'
import { initGist } from './commonLog'
import getRadar from './getRadar'
import getShuffle from './getShuffle'
import getTop from './getTop'

initStorage()
  .then(initGist)
  .then(() => console.log('INIT FINIE'))

const PORT = 3002
const app = express()

getRadar(app)
getShuffle(app)
getTop(app)

app.get('/api/ifttt/:user', (req, res) => {
  setIftttUser(req.params.user).then(() => res.status(200).send('ok'))
})

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`)
  console.log('Press Ctrl+C to quit.')
})
