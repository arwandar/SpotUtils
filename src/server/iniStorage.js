import storage from 'node-persist'

import SpotInstance from './SpotInstance'

export default () =>
  new Promise((resolve, reject) => {
    storage
      .init({
        logging: false,
        dir: './.node-persist/storage',
      })
      .then(async () => {
        const spotInstances = {}
        const spotParams = await storage.getItem('spotParams')
        if (!spotParams) {
          await storage.setItem('spotParams', {
            redirect_uri: 'http://localhost:3002/callback',
            client_id: 'TODO',
            client_secret: 'TODO',
          })
          reject()
        }
        const keys = (await storage.keys()).filter((key) => /user/.test(key))
        console.log(keys)

        /* eslint-disable */
        for (const key of keys) {
          const user = await storage.getItem(key)
          console.log('user', user)
          spotInstances[user.name] = new SpotInstance(spotParams, user)
          if (Object.keys(spotInstances).length === keys.length) console.log('initStorage ok')
        }
        /* eslint-enable */

        resolve({ spotInstances, spotParams })
      })
  })
