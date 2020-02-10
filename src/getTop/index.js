import { getUsernames } from '../commonBDD'
import generateTop from './generateTop'

export default (app) => {
  app.get('/api/top', (req, res) => {
    console.log('top')

    getUsernames()
      .then((usernames) => Promise.all(usernames.map((username) => generateTop(username))))
      .then(() => res.status(200).send('ok'))
      .catch((err) => console.error('/top', err))
  })
}
