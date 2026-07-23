export type SpotifyAlbum = {
    id: string
    name: string
}

export type SpotifyArtist = {
    id: string
    uri: string
    name: string
}

export type SpotifyLinkedFrom = {
    id: string
    uri: string
}

export type SpotifyTrack = {
    id: string
    uri: string
    name: string
    album: SpotifyAlbum
    duration_ms: number
    linked_from?: SpotifyLinkedFrom | null
    is_playable: boolean
    explicit: boolean
    artists: SpotifyArtist[]
}

export type SpotifyTrackEntry = {
    track: SpotifyTrack
}

export type SpotifyTokenResponse = {
    data: {
        access_token: string
        expires_in: number
        refresh_token: string
    }
}

export type SpotifyPaginatedItems<T> = {
    items: T[]
    next: string | null
}


