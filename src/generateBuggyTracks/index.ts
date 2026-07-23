import { Op } from 'sequelize'

import { Track, User, updateAccessToken } from '../sequelize'
import { customAxios, getParams, refillPlaylist } from '../utils'

type AudioFeatureUpdate = {
  id: string
  acousticness: number | null
  danceability: number | null
  energy: number | null
  instrumentalness: number | null
  liveness: number | null
  speechiness: number | null
  tempo: number | null
  valence: number | null
}

type TrackAnalysis = {
  uri: string | null
  sum: number
}

const updateAudioFeatures = async (): Promise<void> => {
  const tracksWithoutAudioFeatures = await Track.findAll({
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

  const trackIds = tracksWithoutAudioFeatures.map(({ id }) => id)
  if (trackIds.length === 0) return

  const user = await User.findOne()
  if (!user) throw new Error('User not found')

  const updatedUser = await updateAccessToken(user)

  const processTrack = async (audioFeatures: AudioFeatureUpdate[]): Promise<void> => {
    const audioFeature = audioFeatures.pop()
    if (!audioFeature) return

    await Track.update(audioFeature, { where: { id: audioFeature.id } })
    await processTrack(audioFeatures)
  }

  const processTracks = async (): Promise<void> => {
    if (trackIds.length === 0) return

    const { data } = await customAxios.get(
      'audio-features',
      getParams({ ids: trackIds.splice(0, 100).join(',') }, updatedUser)
    )

    await processTrack(data.audio_features)
    await processTracks()
  }

  await processTracks()
}

const getDouble = async (): Promise<Set<string | null>> => {
  const tracksToAnalyse = await Track.findAll({
    include: { model: User, as: 'owner', required: true },
  })

  const getSum = (track: Track): number =>
    [
      'danceability',
      'energy',
      'speechiness',
      'acousticness',
      'instrumentalness',
      'liveness',
      'valence',
    ].reduce((sum, key) => sum + Number(track[key as keyof Track] ?? 0), 0) +
    Number(track.tempo ?? 0) / 1000 +
    Number(track.duration_ms ?? 0) / 10000

  const analyses: TrackAnalysis[] = tracksToAnalyse.map((track) => ({
    uri: track.uri,
    sum: getSum(track),
  }))

  const double = new Set<string | null>()
  for (let i = 0; i < analyses.length - 1; i += 1) {
    for (let j = i + 1; j < analyses.length; j += 1) {
      if (analyses[i].sum === analyses[j].sum) {
        double.add(analyses[i].uri)
        double.add(analyses[j].uri)
      }
    }
  }

  return double
}

export default async (): Promise<void> => {
  const unplayableTracks = await Track.findAll({
    attributes: ['uri'],
    where: { is_playable: false },
  })

  await updateAudioFeatures()

  const duplicateTracks = await getDouble()

  const uris = [
    ...unplayableTracks.map(({ uri }) => uri).filter((uri): uri is string => uri != null),
    'spotify:track:6H4B9gJD6eQlNoEh8q85pP',
    'spotify:track:3mPuBLqbLyJcATmzbYFKYz',
    'spotify:track:65rkHetZXO6DQmBh3C2YtW',
    ...[...duplicateTracks].filter((uri): uri is string => uri != null),
  ]

  const users = await User.findAll()
  const processUser = async (): Promise<void> => {
    const currentUser = users.pop()
    if (!currentUser) return

    if (!currentUser.buggyTracksPlaylist) return processUser()

    await refillPlaylist(currentUser, currentUser.buggyTracksPlaylist, [...uris])
    await processUser()
  }

  await processUser()
}
