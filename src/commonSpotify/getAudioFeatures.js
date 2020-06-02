import getUserWithToken from './getUserWithToken'
import Axios, { gestionErreur, getParams } from './utils'

const getAudioFeatures = (user: Object, ids: Array<string>, audioFeatures: Array<Object> = []) =>
  Axios.get('audio-features', getParams({ ids: ids.splice(0, 100).join(',') }, user))
    .then(({ data }) => {
      const nextAudioFeatures = [...audioFeatures, ...data.audio_features]
      return ids.length > 0
        ? getAudioFeatures(user, ids, nextAudioFeatures)
        : Promise.resolve(nextAudioFeatures)
    })
    .catch((e) => gestionErreur(e, 'getAudioFeatures'))

export default (username: string, ids: Array<string>) =>
  ids.length > 0
    ? getUserWithToken(username).then((user) => getAudioFeatures(user, ids))
    : Promise.resolve([])
