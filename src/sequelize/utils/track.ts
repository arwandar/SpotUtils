import type { SpotifyTrack } from '../../utils/type'
import Track from '../models/Track.model'
import { addArtists } from './artist'

export const addTrack = async (
  spotifyTrack: SpotifyTrack,
  {
    linkTrackToUser,
    shouldAddArtists = false,
  }: { linkTrackToUser?: (track: Track) => Promise<unknown>, shouldAddArtists: boolean }
): Promise<Track> => {
  const trackData = {
    id: spotifyTrack.linked_from?.id ?? spotifyTrack.id,
    uri: spotifyTrack.linked_from?.uri ?? spotifyTrack.uri,
    name: spotifyTrack.name,
    album_id: spotifyTrack.album.id,
    album_name: spotifyTrack.album.name,
    duration_ms: spotifyTrack.duration_ms,
    is_playable: spotifyTrack.is_playable,
    explicit: spotifyTrack.explicit,
  }

  const existingTrack = await Track.findByPk(trackData.id)
  const dbTrack = existingTrack ?? (await Track.create(trackData))

  if (existingTrack) await existingTrack.update(trackData)

  if (linkTrackToUser) await linkTrackToUser(dbTrack)
  if (shouldAddArtists) await addArtists(spotifyTrack.artists, { dbTrack })

  return dbTrack
}
