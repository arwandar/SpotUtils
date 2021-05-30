import Track from '../models/Track.model'
import { addArtists } from './artist'

// eslint-disable-next-line import/prefer-default-export
export const addTrack = async (
  spotifyTrack,
  {
    linkFctToUser,
    shouldAddArtists = false,
  }: { linkFctToUser: Function, shouldAddArtists: boolean }
) => {
  const track = {
    id: (spotifyTrack.linked_from && spotifyTrack.linked_from.id) || spotifyTrack.id,
    uri: (spotifyTrack.linked_from && spotifyTrack.linked_from.uri) || spotifyTrack.uri,
    name: spotifyTrack.name,
    album_id: spotifyTrack.album.id,
    album_name: spotifyTrack.album.name,
    duration_ms: spotifyTrack.duration_ms,
    is_playable: spotifyTrack.is_playable,
    explicit: spotifyTrack.explicit,
  }
  let bddTrack = await Track.findByPk(track.id)

  if (!bddTrack) bddTrack = await Track.create(track)
  else {
    Object.entries(track).forEach(([key, val]) => {
      bddTrack[key] = val
    })
    await bddTrack.save()
  }

  if (linkFctToUser) await linkFctToUser(bddTrack)
  if (shouldAddArtists) await addArtists(spotifyTrack.artists, { bddTrack })

  return bddTrack
}
