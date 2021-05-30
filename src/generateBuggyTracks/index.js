import { Op } from 'sequelize'

import { Track, User, updateAccessToken } from '../sequelize'
import { customAxios, getParams, refillPlaylist } from '../utils'

const updateAudioFeatures = async () => {
  let withoutFeatureTracks = await Track.findAll({
    attributes: ['id'],
    where: {
      [Op.or]: [
        { acousticness: { [Op.is]: null } },
        { danceability: { [Op.is]: null } },
        { energy: { [Op.is]: null } },
        { instrumentalness: { [Op.is]: null } },
        { liveness: { [Op.is]: null } },
        { speechiness: { [Op.is]: null } },
        { tempo: { [Op.is]: null } },
        { valence: { [Op.is]: null } },
      ],
    },
  })
  withoutFeatureTracks = withoutFeatureTracks.map(({ id }) => id)
  if (withoutFeatureTracks.length === 0) return Promise.resolve()

  let user = await User.findOne()
  user = await updateAccessToken(user)

  const processTrack = async (audioFeatures) => {
    const audioFeature = audioFeatures.pop()
    if (!audioFeature) return Promise.resolve()
    await Track.update(audioFeature, { where: { id: audioFeature.id } })
    return processTrack(audioFeatures)
  }

  const processTracks = async () => {
    if (withoutFeatureTracks.length === 0) return Promise.resolve()
    const { data } = await customAxios.get(
      'audio-features',
      getParams({ ids: withoutFeatureTracks.splice(0, 100).join(',') }, user)
    )
    await processTrack(data.audio_features)
    return processTracks()
  }
  return processTracks()
}

const getDouble = async () => {
  let tracksToAnalyse = await Track.findAll({ include: { model: User, as: 'owner' } })

  const getSum = (track) =>
    [
      'danceability',
      'energy',
      'speechiness',
      'acousticness',
      'instrumentalness',
      'liveness',
      'valence',
    ].reduce((sum, key) => sum + track[key], 0) +
    track.tempo / 1000 +
    track.duration_ms / 10000

  tracksToAnalyse = tracksToAnalyse.map((track) => ({ uri: track.uri, sum: getSum(track) }))

  const double = new Set()
  for (let i = 0; i < tracksToAnalyse.length - 1; i += 1) {
    for (let j = i + 1; j < tracksToAnalyse.length; j += 1) {
      if (tracksToAnalyse[i].sum === tracksToAnalyse[j].sum) {
        double.add(tracksToAnalyse[i].uri)
        double.add(tracksToAnalyse[j].uri)
      }
    }
  }

  return double
}

export default async () => {
  const unplayableTracks = await Track.findAll({
    attributes: ['uri'],
    where: { is_playable: false },
  })

  await updateAudioFeatures()

  const double = await getDouble()

  const uris = [
    ...unplayableTracks.map(({ uri }) => uri),
    'spotify:track:6H4B9gJD6eQlNoEh8q85pP',
    'spotify:track:3mPuBLqbLyJcATmzbYFKYz',
    'spotify:track:65rkHetZXO6DQmBh3C2YtW',
    ...double,
  ]

  const users = await User.findAll()
  const processUser = async () => {
    const user = users.pop()
    if (!user) return Promise.resolve()
    await refillPlaylist(user, user.buggyTracksPlaylist, [...uris])
    return processUser()
  }

  return processUser()
}
