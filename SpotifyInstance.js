import storage from 'node-persist'
import requestPromise from 'request-promise'
import queryString from 'querystring'
import Random from 'random-js'
import Promise from 'bluebird'

const random = new Random(Random.engines.mt19937().autoSeed());

let SpotifyInstance = function (spotParams, user = {}) {
    this.user = user;
    this.spotParams = spotParams;
};

const debug = false;

SpotifyInstance.prototype.finalizeAuthentication = function (code, pseudo) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.refreshAccessToken({
            url: 'https://accounts.spotify.com/api/token',
            method: 'POST',
            form: {
                code: code,
                redirect_uri: self.spotParams.redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(self.spotParams.client_id + ':' + self.spotParams.client_secret).toString('base64'))
            },
            json: true
        }).then(function () {
            return requestPromise({
                url: 'https://api.spotify.com/v1/me',
                headers: {
                    'Authorization': 'Bearer ' + self.user.access_token
                },
                json: true
            });
        })
            .then(function (body) {
                console.log('getMe', body);
                self.user.display_name = body.display_name;
                self.user.email = body.email;
                self.user.id = body.id;
                self.user.uri = body.uri;
                self.user.country = body.country;
                self.user.name = pseudo ? pseudo : body.id;
                console.log('user', self.user);
                storage.setItemSync('user_' + self.user.name, self.user);
                resolve(self.user.name);
            })
            .catch(function (err) {
                console.log('error finalizeAuthentication', err);
                reject();
            });
    });
};

SpotifyInstance.prototype.generateMyRadar = function (idPlaylist) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.collectFollowedArtists()
            .then(function (artists) {
                return self.getNewSongFromArtists(artists);
            }).then(function (tracks) {
            return self.refillPlaylist(idPlaylist, tracks);
        }).then(function () {
            resolve();
        }).catch(function (err) {
            console.log('error generateMyRadar', err);
            reject();
        });
    })
};

SpotifyInstance.prototype.generateMyShuffle = function (idPlaylist) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.collectSavedTracks()
            .then(function (tracks) {
                tracks.sort(function (a, b) {
                    return b.note - a.note;
                });
                return self.refillPlaylist(idPlaylist, tracks);
            }).then(function () {
            resolve()
        });
    });
};

SpotifyInstance.prototype.generateMyDoublons = function (idPlaylist) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.collectSavedTracks()
            .then(function (tracks) {
                //console.log(tracks[0]);
                //let tracksIndex = {},
                let artistsIndex = {};
                for (let i in tracks) {
                    let track = tracks[i];
                    if (!artistsIndex[track.artist_id]) {
                        artistsIndex[track.artist_id] = {
                            name: track.artist_name,
                            tracks: []
                        };
                    }
                    artistsIndex[track.artist_id].tracks.push(track);
                }

                function clean(str) {
                    str = str.toLowerCase();
                    str = str.replace(new RegExp('\\(', 'g'), '');
                    str = str.replace(new RegExp('\\)', 'g'), '');
                    str = str.replace(new RegExp(' ', 'g'), '');
                    str = str.replace(new RegExp('-', 'g'), '');
                    str = str.replace(new RegExp('deluxe', 'g'), '');
                    str = str.replace(new RegExp('remastered', 'g'), '');
                    return str
                }

                let result = [];
                for (let i in artistsIndex) {
                    for (let j in artistsIndex[i].tracks) {
                        for (let k in artistsIndex[i].tracks) {
                            if (clean(artistsIndex[i].tracks[j].name) === clean(artistsIndex[i].tracks[k].name) && j !== k) {
                                result.push(artistsIndex[i].tracks[j]);
                                break;
                            }
                        }
                    }

                }
                result.sort(function (a, b) {
                    return (clean(a.name) > clean(b.name)) ? 1 : -1;
                });

                console.log(result);
                return self.refillPlaylist(idPlaylist, result);
            }).then(function () {
            resolve()
        });
    });
};

SpotifyInstance.prototype.generateSortedShuffle = function (idPlaylist, tracks, toDeleteArtists) {
    console.log('start createSortedParamShuffle');
    let self = this;
    return new Promise(function (resolve, reject) {
        let tracksTable = [];
        for (let i in tracks) {
            if (toDeleteArtists.indexOf(tracks[i].artist_id) < 0) {
                tracksTable.push(tracks[i]);
            }
        }
        tracksTable.sort(function (a, b) {
            return b.note - a.note;
        });

        self.refillPlaylist(idPlaylist, tracksTable)
            .then(function () {
                console.log('done');
                resolve();
            }).catch(function (err) {
            console.error('erreur lors de createSortedShuffle', err);
            reject();
        });
    })
};

SpotifyInstance.prototype.startPlayingTrack = function (uri, idDevice = false) {
    console.log('start startPlaying');
    let self = this;
    return new Promise(function (resolve, reject) {
        self.refreshAccessToken().then(function () {
            let opt = {
                url: 'https://api.spotify.com/v1/me/player/play',
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + self.user.access_token,
                    'Content-Type': 'application/json'
                },
                body: {
                    'uris': [uri],
                },
                json: true
            };
            if (idDevice) {
                opt.url += "?device_id=" + idDevice;
            }
            return requestPromise(opt);
        }).then(function () {
            console.log('done');
            resolve();
        }).catch(function (err) {
            console.error('erreur lors de startPlaying', err);
            reject();
        });
    })
};

SpotifyInstance.prototype.startPlayingPlaylist = function (uri, idDevice = false) {
    console.log('start startPlaying');
    let self = this;
    return new Promise(function (resolve, reject) {
        self.refreshAccessToken().then(function () {
            let opt = {
                url: 'https://api.spotify.com/v1/me/player/play',
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + self.user.access_token,
                    'Content-Type': 'application/json'
                },
                body: {
                    'context_uri': uri,
                },
                json: true
            };
            if (idDevice) {
                opt.url += "?device_id=" + idDevice;
            }
            console.log(opt.url);
            return requestPromise(opt);
        }).then(function () {
            console.log('done');
            resolve();
        }).catch(function (err) {
            console.error('erreur lors de startPlaying', err);
            reject();
        });
    })
};

SpotifyInstance.prototype.startPlayingAt = function (postion_ms) {
    console.log('start startPlayingAt');
    let self = this;
    return new Promise(function (resolve, reject) {
        let opt = {
            url: 'https://api.spotify.com/v1/me/player/seek?position_ms=' + postion_ms,
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + self.user.access_token,
                'Content-Type': 'application/json'
            },
            json: true
        };

        self.refreshAccessToken().then(function () {
            return requestPromise(opt);
        }).then(function () {
            console.log('done');
            resolve();
        }).catch(function (err) {
            console.error('erreur lors de startPlayingAt', err);
            reject();
        });
    })
};

SpotifyInstance.prototype.collectFollowedArtists = function (artists = [], uri = 'https://api.spotify.com/v1/me/following?type=artist&limit=50') {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.refreshAccessToken().then(function () {
            return requestPromise({
                url: uri,
                headers: {
                    'Authorization': 'Bearer ' + self.user.access_token
                },
                json: true
            })
        }).then(function (body) {
            for (let i in body.artists.items) {
                artists.push({
                    uri: body.artists.items[i].uri,
                    id: body.artists.items[i].id,
                    name: body.artists.items[i].name,
                    genres: body.artists.items[i].genres
                })
            }

            if (body.artists.next != null) {
                self.collectFollowedArtists(artists, body.artists.next)
                    .then(function (result) {
                        resolve(result);
                    });
            } else {
                resolve(artists);
            }
        }).catch(function (err) {
            console.error('collectFollowedArtists ' + self.user.name, err);
            reject();
        });
    });
};

SpotifyInstance.prototype.collectSavedTracks = function (tracks = [], uri = 'https://api.spotify.com/v1/me/tracks?limit=50') {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.refreshAccessToken().then(function () {
            return requestPromise({
                url: uri,
                headers: {
                    'Authorization': 'Bearer ' + self.user.access_token
                },
                json: true
            })
        }).then(function (body) {
            for (let i in body.items) {
                tracks.push({
                    uri: body.items[i].track.uri,
                    id: body.items[i].track.id,
                    name: body.items[i].track.name,
                    artist_id: body.items[i].track.artists[0].id,
                    artist_name: body.items[i].track.artists[0].name,
                    album_name: body.items[i].track.album.name,
                    note: random.integer(0, 10000)
                })
            }
            if (body.next != null && (!debug || tracks.length < 500)) {
                self.collectSavedTracks(tracks, body.next)
                    .then(function (result) {
                        resolve(result);
                    });
            } else {
                resolve(tracks);
            }
        }).catch(function (err) {
            console.error('collectSavedTracks ' + self.user.name, err);
            reject();
        });
    });
};

SpotifyInstance.prototype.getNewSongFromArtists = function (artists, tracks = []) {
    let self = this;
    return new Promise(function (resolve, reject) {
        let extract = artists.splice(0, 1);
        self.getNewSongFromArtist(extract[0]).then(function (result) {
            for (let i in result) {
                tracks.push(result[i]);
            }
            if (artists.length > 0) {
                self.getNewSongFromArtists(artists, tracks)
                    .then(function (tracks) {
                        resolve(tracks);
                    })
            } else {
                resolve(tracks);
            }
        }).catch(function (err) {
            console.error('erreur lors de getNewSongFromArtists', err);
            reject();
        })
    })
};

SpotifyInstance.prototype.getNewSongFromArtist = function (artist) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.getNewAlbumsFromArtist(artist)
            .then(function (albums) {
                console.log('albums ' + artist.name, albums);
                if (albums.length > 0) {
                    return requestPromise({
                        url: 'https://api.spotify.com/v1/albums?' + queryString.stringify({
                            ids: albums.toString(),
                            market: 'FR',
                        }),
                        headers: {
                            'Authorization': 'Bearer ' + self.user.access_token,
                        },
                        json: true
                    })
                }
            }).then(function (body) {
            let result = [];
            if (body) {
                for (let i in body.albums) {
                    for (let j in body.albums[i].tracks.items) {
                        result.push(body.albums[i].tracks.items[j].uri);
                    }
                }
            }
            resolve(result);
        }).catch(function (err) {
            console.error('getNewSongFromArtist ' + artist.name, err);
            reject();
        });
    })
};

SpotifyInstance.prototype.getNewAlbumsFromArtist = function (artist) {
    let self = this;
    return new Promise(function (resolve, reject) {
        self.refreshAccessToken().then(function () {
            return requestPromise({
                url: 'https://api.spotify.com/v1/search?' + queryString.stringify({
                    market: "FR",
                    type: 'album',
                    'q': 'tag:new artist:' + artist.name

                }),
                headers: {
                    'Authorization': 'Bearer ' + self.user.access_token,
                },
                json: true
            })
        }).then(function (body) {
            let result = [];
            if (body.albums.total !== 0) {
                for (let i in body.albums.items) {
                    for (let j in body.albums.items[i].artists) {
                        if (body.albums.items[i].artists[j].id === artist.id) {
                            result.push(body.albums.items[i].id);
                        }
                    }
                }
            }
            resolve(result);
        }).catch(function (err) {
            console.error('erreur lors de getNewAlbums', err);
            reject();
        });

    })
};

SpotifyInstance.prototype.addNewArtistsRockAmRing = function (newArtists) {
  return new Promise((resolve, reject) => {
    let artistsTable = {}
    for (let i in newArtists) {
      let x = newArtists[i]
      if (x.id.match(/https:\/\/open\.spotify\.com\/artist\/([\w-]+)/)) {
        artistsTable[x.id.match(/https:\/\/open\.spotify\.com\/artist\/([\w-]+)/)[1]] = x.id.match(/https:\/\/open\.spotify\.com\/artist\/([\w-]+)/)[1]
      } else if (x.id.match(/([\w-]+)/)) {
        artistsTable[x.id] = x.id
      }
    }

    this.refreshAccessToken().then(() => {
      return this.getInfoArtists(artistsTable)
    }).then(artists => {
      let data = storage.getItemSync('rockAmRingSettings')
      Object.keys(artists).forEach((artistId) => {
        let artist = artists[artistId]
        data.artists[artist.id] = {
          id: artist.id,
          genres: artist.genres.join(', '),
          name: artist.name,
          followers: artist.followers.total
        }
      })
      storage.setItemSync('rockAmRingSettings', data)
      resolve()
    })
  })
}

SpotifyInstance.prototype.generateMyRockAmRing = function (playlist, artists) {
  return new Promise((resolve, reject) => {
    this.refreshAccessToken().then(() => {
      Promise.map(artists, (artist) => {
        return this.getArtistTopSongs(artist)
      }).then(data => {
        let tracks = data.reduce((accu, tracksList) => accu.concat(tracksList))
        tracks.sort(function (a, b) {
          return b.note - a.note
        })
        return this.refillPlaylist(playlist, tracks)
      }).then(() => {
        console.log('miaw')
        resolve()
      })
    })
  })
}

SpotifyInstance.prototype.getArtistTopSongs = function (artistId) {
  return new Promise((resolve, reject) => {
    let opt = {
      url: 'https://api.spotify.com/v1/artists/' + artistId + '/top-tracks?country=FR',
      headers: {
        'Authorization': 'Bearer ' + this.user.access_token,
      },
      json: true
    }
    requestPromise(opt)
      .then(function (body) {
        let result = body.tracks.map(x => {return {uri: x.uri, note: random.integer(0, 10000)}})
        resolve(result)
      }).catch(function (err) {
      console.error('erreur lors de getArtistTopSongs ' + artistId, err)
      reject()
    })

  })
}


SpotifyInstance.prototype.getInfoArtists = function (artistsIndex, artistsTable) {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (artistsTable === undefined) {
            artistsTable = [];
            for (let i in artistsIndex) {
                artistsTable.push(artistsIndex[i]);
            }
        }

        let extract = artistsTable.splice(0, 50);
        let string = '?ids=';
        for (let i in extract) {
            string += extract[i] + ',';
        }
        string = string.slice(0, -1);
        let opt = {
            url: 'https://api.spotify.com/v1/artists' + string,
            headers: {
                'Authorization': 'Bearer ' + self.user.access_token,
            },
            json: true
        };
        requestPromise(opt)
            .then(function (body) {
                for (let i in body.artists) {
                    artistsIndex[body.artists[i].id] = body.artists[i];
                }

                if (artistsTable.length > 0) {
                    self.getInfoArtists(artistsIndex, artistsTable)
                        .then(function (result) {
                            resolve(result);
                        });
                } else {
                    resolve(artistsIndex);
                }
            }).catch(function (err) {
            console.error('erreur lors de getInfoArtists', err);
            reject();
        })
    })
};

SpotifyInstance.prototype.refillPlaylist = function (idPlaylist, tracks) {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (tracks.length === 0)
            resolve();
        tracks = self.cleanTracksForCall(tracks);

        let opt = {
            url: 'https://api.spotify.com/v1/users/' + self.user.id + '/playlists/' + idPlaylist + '/tracks',
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + self.user.access_token,
                'Content-Type': 'application/json'
            },
            body: {
                'uris': tracks.splice(0, 100),
            },
            json: true
        };

        requestPromise(opt).then(function (body) {
            if (tracks.length === 0) {
                resolve();
            } else {
                return self.addTracksToPlaylist(idPlaylist, tracks);
            }
        }).then(function () {
            resolve();
        }).catch(function (err) {
            console.error('erreur lors de refillPlaylist', err);
            reject();
        })
    })
};

SpotifyInstance.prototype.addTracksToPlaylist = function (idPlaylist, tracks) {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (tracks.length === 0)
            resolve();

        tracks = self.cleanTracksForCall(tracks);
        let opt = {
            url: 'https://api.spotify.com/v1/users/' + self.user.id + '/playlists/' + idPlaylist + '/tracks',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + self.user.access_token,
                'Content-Type': 'application/json'
            },
            body: {
                'uris': tracks.splice(0, 100),
            },
            json: true
        };
        requestPromise(opt).then(function () {
            if (tracks.length > 0) {
                self.addTracksToPlaylist(idPlaylist, tracks)
                    .then(function () {
                        resolve();
                    });
            } else {
                resolve();
            }
        }).catch(function (err) {
            console.error('erreur lors de addTracksToPlaylist', err);
            reject();
        })
    })
};

SpotifyInstance.prototype.cleanTracksForCall = function (tracks) {
    if (typeof tracks[0] === 'object') {
        for (let i in tracks) {
            tracks[i] = tracks[i].uri;
        }
    }
    return tracks;
};

SpotifyInstance.prototype.refreshAccessToken = function (options) {
    let self = this;
    return new Promise(function (resolve, reject) {
        if (!options) {
            options = {
                url: 'https://accounts.spotify.com/api/token',
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + (new Buffer(self.spotParams.client_id + ':' + self.spotParams.client_secret).toString('base64'))
                },
                form: {
                    grant_type: 'refresh_token',
                    refresh_token: self.user.refresh_token
                },
                json: true
            };
        }
        if (self.user.expires_in && self.user.expires_in > new Date()) {
            resolve();
        } else {
            requestPromise(options).then(function (body) {
                let expires_in = new Date();
                expires_in.setSeconds(expires_in.getSeconds() + body.expires_in);
                self.user.access_token = body.access_token;
                self.user.expires_in = expires_in;
                if (body['refresh_token']) {
                    self.user.refresh_token = body['refresh_token'];
                }
                if (!options)
                    storage.setItemSync('user_' + self.user.name, self.user);
                console.log("new tokens for", self.user.name);
                resolve();
            }).catch(function (err) {
                console.error('erreur lors de refreshAccessToken', err);
                reject();
            });
        }
    });
};

export default SpotifyInstance;
