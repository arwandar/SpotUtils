import { getUsernames } from '../commonBDD'
import generateTop from './generateTop'

const topFor = (usernames) =>
  generateTop(usernames.pop()).then(() =>
    usernames.length === 0 ? Promise.resolve() : generateTop(usernames)
  )

export default (app) => {
  app.get('/api/top', (req, res) => {
    console.log('top')

    getUsernames()
      .then((usernames) => topFor(usernames))
      .then(() => res.status(200).send('ok'))
  })
}
