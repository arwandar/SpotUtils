import Artist from '../models/Artist.model'
import Track from '../models/Track.model'

// eslint-disable-next-line import/prefer-default-export
export const addArtists = async (
  artists,
  { bddTrack, linkFctToUser }: { bddTrack?: Track, linkFctToUser?: Function }
) => {
  const spotifyArtist = artists.pop()
  if (!spotifyArtist) return Promise.resolve()

  let bddArtist = await Artist.findByPk(spotifyArtist.id)
  if (!bddArtist)
    bddArtist = await Artist.create({
      id: spotifyArtist.id,
      uri: spotifyArtist.uri,
      name: spotifyArtist.name,
    })
  if (bddTrack) await bddTrack.addArtist(bddArtist)
  if (linkFctToUser) await linkFctToUser(bddArtist)

  return addArtists(artists, { bddTrack, linkFctToUser })
}
