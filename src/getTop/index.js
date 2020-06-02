import { getUsernames } from '../commonBDD'
import generateTop from './generateTop'

const topFor = (usernames) =>
  usernames.length === 0
    ? Promise.resolve()
    : generateTop(usernames.pop()).finally(() => topFor(usernames))

export default (app) => {
  app.get('/api/top', (req, res) => {
    console.log('top')
    getUsernames()
      .then(topFor)
      .finally(() => res.status(200).send('ok'))
  })
}
