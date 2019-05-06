import React from 'react';
import axios from 'axios';
import { Grid, Button } from 'semantic-ui-react';
import Track from '../presentational/Track.jsx';

export default class Session extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tracks: null,
            sessionKey: null
        }
        this.handleStartSession = this.handleStartSession.bind(this);
        this.handleOnclickTrack = this.handleOnclickTrack.bind(this);
    }

    handleStartSession = () => {
        axios.get('http://localhost:5000/api/session/start', { withCredentials: true })
            .then(res => {
                res.data.tracks.forEach(track => {
                    track.opacity = '.15';
                });
                res.data.tracks[0].opacity = 1;
                this.setState({
                    tracks: res.data.tracks,
                    sessionKey: res.data.sessionKey
                })
            })
            .catch(err => {
                console.log(err);
            })
    }

    handleOnclickTrack = (id) => {
        
    }

    render() {
        return (
            <Grid>
                <Grid.Row centered columns={1}>
                    <Button onClick={this.handleStartSession}>Start Session</Button>
                    {
                        this.state.sessionKey != null && 
                        <h3>{`You Session Key: ${this.state.sessionKey}`}</h3>
                    }
                </Grid.Row>
                <Grid.Row centered columns={3}>
                    {
                        this.state.tracks != null &&
                        this.state.tracks.map((track, i) => {
                            return (<Track key={i} track={track} onClickHandler={this.handleOnclickTrack} playing={false} />)
                        })
                    }
                </Grid.Row>
            </Grid>
        )
    }
}
