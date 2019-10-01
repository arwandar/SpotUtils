import express from 'express'

import addRoutes from './addRoutes'

const app = express()

addRoutes(app)

const PORT = 3002

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`)
  console.log('Press Ctrl+C to quit.')
})
