var express = require('express');
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var rp = require('request-promise');
var querystring = require('querystring');
var uuidv1 = require('uuid/v1');
var SpotifyWebApi = require('spotify-web-api-node');

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

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});

app.get('/api/login', (req, res) => {
    let state = generateRandomString(16);
    res.cookie(stateKey, state);

    let scope = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing app-remote-control streaming';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
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
                spotifyApi.setAccessToken(access_token);
                res.cookie('access_token', access_token);
                res.cookie('refresh_token', refresh_token);
                res.redirect('http://localhost:8080/app.html');
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
    listeningSessions.find({}).exec((err, doc) => {
        if (err) {
            console.log(err);
            res.send(err);
        }
        listeningSessions.remove(doc), (err, doc) => {
            if (err) {
                console.log(err);
                res.send(err);
            }
            console.log('Deleted last doc');
        }
    });
    let listeningSession = {
        guid: uuidv1(),
        tracks: ['5IaHrVsrferBYDm0bDyABy', '63cd4JkwGgYJrbOizbfmsp', '20I6sIOMTCkB6w7ryavxtO']
    };
    listeningSessions.insert(listeningSession, (err, doc) => {
        console.log('Inserted new session ' + doc.guid);
    });
    let tracks = listeningSession.tracks.join(',');
    
    let auth_header = { 'Authorization': 'Bearer ' + req.cookies.access_token };
    rp.get({
        url: 'https://api.spotify.com/v1/me/player/devices',
        headers: auth_header,
        json: true
    })
    .then(result => {
            result.devices.forEach(device => {
                if (device.name == 'Web Playback SDK Quick Start Player') {
                    rp.put({
                        url: 'https://api.spotify.com/v1/me/player',
                        headers: auth_header,
                        body: { device_ids: [device.id], play: false },
                        json: true
                    })
                    .then(() => {
                        rp.get({
                            url: `https://api.spotify.com/v1/tracks/?ids=${tracks}`,
                            headers: auth_header,
                            json: true
                        })
                        .then((result) => {
                            rp.put({
                                url: 'https://api.spotify.com/v1/me/player/play',
                                headers: auth_header,
                                body: {
                                    uris: [result.tracks[0].uri]
                                },
                                json: true
                            })
                            .then(() => {
                                res.send({tracks: result.tracks, sessionKey: listeningSession.guid});
                            })
                        })
                    })
                }
            });
        }
    )
    .catch(err => {
        console.log(err);
        res.send(err);
    })
})

app.listen(port, () => console.log(`Listening on port ${port}`));