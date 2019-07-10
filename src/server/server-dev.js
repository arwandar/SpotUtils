import path from 'path'

import express from 'express'
import webpack from 'webpack' // eslint-disable-line import/no-extraneous-dependencies
import webpackDevMiddleware from 'webpack-dev-middleware' // eslint-disable-line import/no-extraneous-dependencies
import webpackHotMiddleware from 'webpack-hot-middleware' // eslint-disable-line import/no-extraneous-dependencies

import config from '../../webpack.dev.config'
import addRoutes from './addRoutes'

const app = express()

const DIST_DIR = __dirname
const HTML_FILE = path.join(DIST_DIR, 'index.html')
const compiler = webpack(config)

app.use(
  webpackDevMiddleware(compiler, {
    publicPath: config.output.publicPath,
  })
)

app.use(webpackHotMiddleware(compiler))

app.get('/', (req, res, next) => {
  compiler.outputFileSystem.readFile(HTML_FILE, (err, result) => {
    if (err) {
      return next(err)
    }
    res.set('content-type', 'text/html')
    res.send(result)
    return res.end()
  })
})

addRoutes(app)

const PORT = 3002

app.listen(PORT, () => {
  console.log(`App listening to ${PORT}....`)
  console.log('Press Ctrl+C to quit.')
})
