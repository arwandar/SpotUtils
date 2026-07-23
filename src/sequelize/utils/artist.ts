import type { SpotifyArtist } from '../../utils/type'
import Artist from '../models/Artist.model'
import Track from '../models/Track.model'

export const addArtists = async (
  artists: SpotifyArtist[],
  { dbTrack, linkArtistToUser }: { dbTrack?: Track, linkArtistToUser?: (artist: Artist) => Promise<unknown> }
): Promise<void> => {
  const spotifyArtist = artists.pop()
  if (!spotifyArtist) return

  const existingArtist = await Artist.findByPk(spotifyArtist.id)
  const dbArtist = existingArtist ?? (await Artist.create({
    id: spotifyArtist.id,
    uri: spotifyArtist.uri,
    name: spotifyArtist.name,
  }))

  if (dbTrack) await dbTrack.addArtist(dbArtist)
  if (linkArtistToUser) await linkArtistToUser(dbArtist)

  await addArtists(artists, { dbTrack, linkArtistToUser })
}
