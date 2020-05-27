import Axios from 'axios'

import getUserWithToken from './getUserWithToken'
import { getParams } from './utils'

const getAudioFeatures = (user: Object, ids: Array<string>, audioFeatures: Array<Object> = []) =>
  Axios.get(
    'https://api.spotify.com/v1/audio-features',
    getParams({ ids: ids.splice(0, 100).join(',') }, user)
  )
    .then(({ data }) => {
      const nextAudioFeatures = [...audioFeatures, ...data.audio_features]
      return ids.length > 0
        ? getAudioFeatures(user, ids, nextAudioFeatures)
        : Promise.resolve(nextAudioFeatures)
    })
    .catch(() => {
      console.log('ERREUR::getAudioFeatures.js::33')
    })

export default (username: string, ids: Array<string>) =>
  getUserWithToken(username).then((user) => getAudioFeatures(user, ids))
