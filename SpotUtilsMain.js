import bodyParser from "body-parser";
import storage from "node-persist";
import express from "express";
import queryString from "querystring";
import SpotifyInstance from "./SpotifyInstance";
import Promise from "bluebird";
import auth from "express-authentication";
import basic from "express-authentication-basic";
import console_stamp from "console-stamp";

console_stamp(console, {
    pattern: "dd/mm/yyyy HH:MM:ss.l"
});

/*
const urlencodedParser = bodyParser.urlencoded({
    extended: false
});
*/

const expressPort = 3003;
let spotifyInstance = {};

let spotParams;

storage.init({
    logging: true
}).then(function () {
    //storage.clearSync();
    spotParams = storage.getItemSync('spotParams');
    if (!spotParams) {
        storage.setItemSync('spotParams');
        console.error('Merci de remplir le fichier de storage spotParams avec les éléments du readme')
    }

    let users = storage.valuesWithKeyMatch(/user\_/);

    for (let i in users) {
        spotifyInstance[users[i].name] = new SpotifyInstance(spotParams, users[i]);
    }

});

// CREATION DU SERVEUR EXPRESS
const app = express();
app.use(express.static('public'))
    .use(bodyParser.json({
        limit: '50mb'
    }))
    .use(bodyParser.urlencoded({
        extended: true,
        limit: '50mb'
    }))
    .use(basic(function verify(challenge, callback) {
        if (challenge.username === 'Pixelle' && challenge.password === 'Batou') {
            callback(null, true, {});
        } else {
            console.error("problème sur l'authentification");
            callback(null, false, {
                error: 'INVALID_PASSWORD'
            });
        }
    }));

app.get('/', auth.required(), function (req, res) {
    res.status(200).render('index.ejs');
});

app.get('/users', auth.required(), function (req, res) {
    res.status(200).render('index.ejs', {
        template: 'users',
        users: spotifyInstance
    });
});

app.get('/playAlarm/:user/:playlist', auth.required(), function (req, res) {
    res.status(200).send();
    spotifyInstance[req.params.user].startPlayingPlaylist(req.params.playlist, spotParams.raspberry)
        .then(function () {
            console.log('done');
        })
});

//PROCESSUS DE LOGIN
app.get('/login', auth.required(), function (req, res) {
    console.log('/login');
    let scope = 'playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private streaming user-follow-modify user-follow-read user-library-read user-library-modify user-read-private user-read-birthdate user-read-email user-top-read user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played';
    res.redirect('https://accounts.spotify.com/authorize?' +
        queryString.stringify({
            response_type: 'code',
            client_id: spotParams.client_id,
            scope: scope,
            redirect_uri: spotParams.redirect_uri,
            state: req.query.pseudo
        }));
});

app.get('/callback', auth.required(), function (req, res) {
    console.log('/callback');
    let tmpSpotifyInstance = new SpotifyInstance(spotParams);
    tmpSpotifyInstance.finalizeAuthentication(req.query.code, req.query.state)
        .then(function (userName) {
            spotifyInstance[userName] = tmpSpotifyInstance;
            res.redirect('/');
        }).catch(function (err) {
        res.status(300).send('something went wrong!!');
    });
});

app.delete('/delete/:id', auth.required(), function (req, res) {
    storage.removeItemSync('user_' + req.params.id);
    delete spotifyInstance[req.params.id];
    res.status(203).send();
});

app.get('/customShuffleAll', auth.required(), function (req, res) {
    let spotifyInstanceTable = [];
    for (let i in spotifyInstance) {
        spotifyInstanceTable.push(spotifyInstance[i]);
    }

    Promise.map(spotifyInstanceTable, function (user) {
        return user.collectSavedTracks();
    }).then(function (data) {
        let tracksIndex = {},
            artistsIndex = {};

        let artistToDelete = storage.getItemSync('artistToDelete');
        if (!artistToDelete)
            artistToDelete = '';

        for (let i in data) {
            for (let j in data[i]) {
                let track = data[i][j];
                if (!tracksIndex[track.id]) {
                    tracksIndex[track.id] = track;
                    if (!artistsIndex[track.artist_id]) {
                        artistsIndex[track.artist_id] = {
                            name: track.artist_name,
                            tracks: [],
                        };

                        artistsIndex[track.artist_id].toDelete = (artistToDelete.indexOf('/' + track.artist_id + '/') >= 0);
                    }
                    artistsIndex[track.artist_id].tracks.push(track.name)
                }
                artistsIndex[track.artist_id].user = artistsIndex[track.artist_id].user !== undefined && artistsIndex[track.artist_id].user !== spotifyInstanceTable[i].user.name ? 'all' : spotifyInstanceTable[i].user.name;
            }
        }

        let artistsTable = [], tmp = {};
        for (let i in artistsIndex) {
            let letter = artistsIndex[i].name.slice(0, 1).toLowerCase();

            if (!isNaN(letter)) {
                letter = 0;
            }
            if (!tmp[letter]) {
                tmp[letter] = [];
            }

            tmp[letter].push({
                id: i,
                name: artistsIndex[i].name,
                tracks: artistsIndex[i].tracks,
                toDelete: artistsIndex[i].toDelete,
                user: artistsIndex[i].user
            });
        }

        for (let i in tmp) {
            artistsTable.push(tmp[i]);
        }

        artistsTable.sort(function (a, b) {
            return a[0].name.toLowerCase().localeCompare(b[0].name.toLowerCase());
        });

        for (let i in artistsTable) {
            artistsTable[i].sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
        }

        res.status(200).render('index.ejs', {
            template: 'customShuffleAll',
            'artistsIndex': artistsTable,
            'tracksIndex': tracksIndex,
            'usersIndex': spotifyInstance
        });
    })

});

app.post('/shuffleAll', auth.required(), function (req, res) {
    console.log('shuffleAll');
    console.log(req.body);
    let tracksIndex = JSON.parse(req.body.tracks);
    let deletedArtists = "/";
    for (let i in req.body.artist) {
        deletedArtists += req.body.artist[i] + '/';
    }
    storage.setItem('artistToDelete', deletedArtists);

    spotifyInstance.arwy.generateSortedShuffle('36CAf0pZvM9TZmUGIE0FUR', tracksIndex, deletedArtists).then(function () {
        res.redirect('/');
    })
});

app.get('/shuffleAll', auth.required(), function (req, res) {
    console.log('shuffleAll');
    let spotifyInstanceTable = [];
    for (let i in spotifyInstance) {
        spotifyInstanceTable.push(spotifyInstance[i]);
    }
    Promise.map(spotifyInstanceTable, function (user) {
        return user.collectSavedTracks();
    }).then(function (data) {
        console.log('get all tracks ok');
        let tracksIndex = {};

        let artistToDelete = storage.getItemSync('artistToDelete');
        if (!artistToDelete)
            artistToDelete = '//';

        for (let i in data) {
            for (let j in data[i]) {
                let track = data[i][j];
                if (!tracksIndex[track.id]) {
                    tracksIndex[track.id] = track;

                }
            }
        }
        return spotifyInstance.arwy.generateSortedShuffle('36CAf0pZvM9TZmUGIE0FUR', tracksIndex, artistToDelete);
    }).then(function () {
        res.redirect('/');
    });
});

app.get('/shuffle/:user/:playlist', auth.required(), function (req, res) {
    console.log('/shuffle ' + req.params.user + ' ' + req.params.playlist);
    spotifyInstance[req.params.user].generateMyShuffle(req.params.playlist)
        .then(function () {
            console.log('done');
            res.redirect('/');
        }).catch(function (err) {
        console.error('/shuffle', err)
    });
});

app.get('/radar/:user/:playlist', auth.required(), function (req, res) {
    console.log('/radar ' + req.params.user + ' ' + req.params.playlist);
    spotifyInstance[req.params.user].generateMyRadar(req.params.playlist)
        .then(function () {
            res.redirect('/');
        }).catch(function (err) {
        console.error('/radar', err)
    });
});

app.get('/doublons/:user/:playlist', auth.required(), function (req, res) {
    console.log('/doublons ' + req.params.user + ' ' + req.params.playlist);
    spotifyInstance[req.params.user].generateMyDoublons(req.params.playlist)
        .then(function () {
            res.redirect('/');
        }).catch(function (err) {
        console.error('/doublons', err)
    });
});

app.get('/refreshTokens/:user', function (req, res) {
    spotifyInstance[req.params.user].refreshAccessToken().then(function () {
        res.send(JSON.stringify({access_token: storage.getItemSync('user_' + req.params.user).access_token}));
    })
});

app.listen(expressPort, function () {
    console.log('Server started');
});