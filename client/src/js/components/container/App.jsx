import React from 'react';
import Script from 'react-load-script';
import { Cookies } from 'react-cookie';
import {  Grid } from 'semantic-ui-react';
import Session from './Session.jsx';

const cookie = new Cookies;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      device_id: null,
      scriptLoaded: false
    };
    this.handleLoadSuccess = this.handleLoadSuccess.bind(this);
    this.handleLoadFailure = this.handleLoadSuccess.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.callback = this.callback.bind(this);
  }

  callback = (token) => {
    return token
  }

  getAccessToken = () => {
    return cookie.get('access_token') || null;
  }

  handleLoadSuccess() {
    var token = this.getAccessToken();
    if (token == null) {
      return;
    }
    console.log("Script loaded");
    const player = new window.Spotify.Player({
      name: 'Web Playback SDK Quick Start Player',
      getOAuthToken: callback => { callback(token ) }
    });

    // Error handling
    player.addListener('initialization_error', ({ message }) => { console.error(message); });
    player.addListener('authentication_error', ({ message }) => { console.error(message); });
    player.addListener('account_error', ({ message }) => { console.error(message); });
    player.addListener('playback_error', ({ message }) => { console.error(message); });

    // Playback status updates
    player.addListener('player_state_changed', state => { console.log(state); });

    // Ready
    player.addListener('ready', ({ device_id }) => {
      console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
      console.log('Device ID has gone offline', device_id);
    });

    // Connect to the player!
    player.connect();
  }

  handleScriptCreate() {
    this.setState({ scriptLoaded: false });
    console.log("Script created");
  }

  handleScriptError() {
    this.setState({ scriptError: true });
    console.log("Script error");
  }

  handleScriptLoad() {
    this.setState({ scriptLoaded: true});
    console.log("Script loaded");
  }

  componentDidMount() {
    window.onSpotifyWebPlaybackSDKReady = () => {
      this.handleLoadSuccess();
    };
  }

  render() {
    return (
      <div className="App" style={{height: '100%'}}>
        <header className="App-header">
          <Script
            url="https://sdk.scdn.co/spotify-player.js"
            onCreate={this.handleScriptCreate.bind(this)}
            onError={this.handleScriptError.bind(this)}
            onLoad={this.handleScriptLoad.bind(this)}
          />
        </header>
        <div style={{height: '100%'}}>
          <Session />
        </div>        
      </div>
    )
  }
}
  
export default App;