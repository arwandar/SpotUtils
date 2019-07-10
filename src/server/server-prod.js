import path from 'path'

import express from 'express'

import addRoutes from './addRoutes'

const app = express()

const DIST_DIR = __dirname
const HTML_FILE = path.join(DIST_DIR, 'index.html')

app.use(express.static(DIST_DIR))

app.get('/', (req, res) => {
  res.sendFile(HTML_FILE)
})

addRoutes(app)

const PORT = 3002
app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`)
  console.log('Press Ctrl+C to quit.')
})
