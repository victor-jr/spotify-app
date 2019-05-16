var express = require('express');
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var rp = require('request-promise');
var querystring = require('querystring');
var uuidv1 = require('uuid/v1');

var app = express();
app.use(cors({ origin: 'http://localhost:8080', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + '/client/dist'));
var port = process.env.PORT || 5000;

var listeningSessions = new Datastore({ filename: './sessions.db', autoload: true });

var client_id = '1ce132c081784f7481f16be1e820852e';
var client_secret = '018e60ef3a9f4e7fa9d1d81f8aece85d';
var redirect_uri = 'http://localhost:5000/api/callback/';

var stateKey = 'spotify_auth_state';

//end points for frontend to call
app.get('/api/login', (req, res) => {
    let state = uuidv1();
    res.cookie(stateKey, state);

    let scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state
        }));
});

app.get('/api/callback', (req, res) => {
    let code = req.query.code || null;
    let state = req.query.state || null;
    let storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/?' + 
        querystring.stringify({
            error: 'state_mismatch',
        }));
    } else {
        res.clearCookie(stateKey);
        let authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        rp.post(authOptions, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                let access_token = body.access_token,
                    refresh_token = body.refresh_token;
                //get user info
                rp.get('https://api.spotify.com/v1/me', {
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                })
                .then((user) => {
                    res.cookie('user_id', user.id);    
                    res.cookie('access_token', access_token);
                    res.cookie('refresh_token', refresh_token);
                    res.redirect('http://localhost:8080/app.html');
                })
                .catch(err => {
                    console.log(err);
                    return err;
                })
            } else {
                res.redirect('/?' +
                querystring.stringify({
                    error: 'invalid_token'
                }));
            }
        })
    }
})

app.get('/api/session/start', (req, res) => {
    let listeningSession = {};
    // check if there already is a session owned by this user
    listeningSessions.findOne({owner:req.cookies['user_id']}, (err, doc) => {
        if (err) {
            console.log(err);
            res.send(err);
        }

        let id = null;
        if (doc == null) {
            listeningSession = {
                guid: uuidv1(),
                owner: req.cookies['user_id'],
                tracks: ['5IaHrVsrferBYDm0bDyABy', '63cd4JkwGgYJrbOizbfmsp', '20I6sIOMTCkB6w7ryavxtO']
            };
            listeningSessions.insert(listeningSession, (err, doc) => {
                console.log('Inserted new session ' + doc._id);
                res.cookie('listening_session', doc._id);
                id = doc._id;
            });
        } else {
            console.log('Found session ' + doc.guid);
            listeningSession = doc;
            res.cookie('listening_session', listeningSession._id);
            id = doc._id;
        }

        let tracks = listeningSession.tracks.join(',');
        let auth_header = { 'Authorization': 'Bearer ' + req.cookies.access_token };

        // get devices active by user
        rp.get({
            url: 'https://api.spotify.com/v1/me/player/devices',
            headers: auth_header,
            json: true
        })
        .then(result => {
            //set spotify player to this app
            result.devices.forEach(device => {
                if (device.name == 'Web Playback SDK Quick Start Player') {
                    rp.put({
                        url: 'https://api.spotify.com/v1/me/player',
                        headers: auth_header,
                        body: { device_ids: [device.id], play: false },
                        json: true
                    })
                    .then(() => {
                        //find tracks then send to client end
                        rp.get({
                            url: `https://api.spotify.com/v1/tracks/?ids=${tracks}`,
                            headers: auth_header,
                            json: true
                        })
                        // .then((result) => {
                        //     rp.put({
                        //         url: 'https://api.spotify.com/v1/me/player/play',
                        //         headers: auth_header,
                        //         body: {
                        //             uris: [result.tracks[0].uri]
                        //         },
                        //         json: true
                        //     })
                            .then((result) => {
                                res.send({tracks: result.tracks, sessionKey: id});
                            })
                        // })
                    })
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.send(err);
        })
    });
})

app.get('/api/session/getLatestTrack', (req, res) => {
    listeningSessions.findOne({_id: req.cookies['listening_session']}, (err, doc) => {
        if (err) {
            res.send(err);
        }
        if (doc == null) {
            res.sendStatus(404);
        } else {
            //get last track to fetch
            let latestTrack = doc.tracks[doc.tracks.length-1];
            rp.get({
                url: `https://api.spotify.com/v1/tracks/${latestTrack}`,
                headers: { 'Authorization': 'Bearer ' + req.cookies.access_token },
                json: true
            })
            .then((track) => {
                res.send({track: track});
            })
            .catch(err => {
                res.send(err);
            })
        }
    })
})

app.get('/api/song/search', (req, res) => {
    rp.get({
        url: 'https://api.spotify.com/v1/search?' + querystring.stringify({ q: req.query.song, type: 'track' }),
        headers: { 'Authorization': 'Bearer ' + req.cookies.access_token },
        json: true
    })
    .then(results => {
        res.send(results.tracks.items);
    })
    .catch(err => {
        res.send(err);
    })
})

app.post('/api/session/addsong', (req, res) => {
    //add song to session queue
    listeningSessions.findOne({_id: req.cookies['listening_session']}, (err, doc) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        if (doc == null) {
            console.log('No session found');
            res.sendStatus(404);
        } else {
            doc.tracks.push(req.body.id);
            listeningSessions.update({owner: req.cookies['user_id']}, { $set: { tracks: doc.tracks }}, {}, (err, numReplaced) => {
                if (err) {
                    res.send(err);
                }
                if (numReplaced == 1) {
                    listeningSessions.persistence.compactDatafile();
                    res.sendStatus(200);
                }
            })
        }
    });
})

app.listen(port, () => console.log(`Listening on port ${port}`));
