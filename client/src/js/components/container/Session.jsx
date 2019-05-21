import React from 'react';
import axios from 'axios';
import { Grid, Button, Sidebar, Container } from 'semantic-ui-react';
import Track from '../presentational/Track.jsx';
import SearchSideBar from './SearchSideBar.jsx';
import { PropTypes } from 'prop-types';

export default class Session extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tracks: null,
            sessionKey: null,
            sideBarVisible: false,
            songPlaying: false
        }
        this.handleStartSession = this.handleStartSession.bind(this);
        this.handleToggleSearch = this.handleToggleSearch.bind(this);
        this.handleGetUpdatedTracks = this.handleGetUpdatedTracks.bind(this);
        this.handlePlaySong = this.handlePlaySong.bind(this);
        // this.handleNextSong = this.handleNextSong.bind(this);
        // this.handleBackSong = this.handleBackSong.bind(this);
    }

    handleStartSession = () => {
        axios.get('http://localhost:5000/api/session/start', { withCredentials: true })
            .then(res => {
                res.data.tracks.forEach(track => {
                    track.opacity = '.3';
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

    handleToggleSearch = () => {
        let sideBarVisible = !this.state.sideBarVisible;
        this.setState({ sideBarVisible });
    }

    handleGetUpdatedTracks = () => {
        axios.get('http://localhost:5000/api/session/getLatestTrack', { withCredentials: true })
        .then(res => {
            let tracks = this.state.tracks;
            res.data.track.opacity = '.3';
            tracks.push(res.data.track);
            this.setState({
                tracks
            })
        })
        .catch(err => {
            console.log(err);
        })
    }

    handlePlaySong = () => {
        axios.get('/api/session/play', { withCredentials: true })
        .then(res => {
            console.log(res);
        })
    }

    render() {
        let { playerLoaded } = this.props;
        let btnText = playerLoaded ? 'Start Session' : 'Loading Player...';
        return (
            <Sidebar.Pushable>
                <SearchSideBar sideBarVisible={this.state.sideBarVisible} handleAddTrack={this.handleGetUpdatedTracks}/>
                
                <Sidebar.Pusher>
                    <Container>
                        <Grid textAlign='center' columns={1}>
                            <Grid.Row></Grid.Row>
                            <Grid.Row>
                                <h4>Logged In</h4>
                            </Grid.Row>
                            <Grid.Row centered columns={1}>
                            {
                                this.state.sessionKey == null ?
                                <Button disabled={!playerLoaded} onClick={this.handleStartSession}>{btnText}</Button> :
                                <Button icon='search' onClick={this.handleToggleSearch} />
                            }
                            </Grid.Row>
                            {
                                this.state.sessionKey != null &&
                                <Grid.Row>
                                    <h3>{`You Session Key: ${this.state.sessionKey}`}</h3>
                                </Grid.Row>
                            }
                            {
                                this.state.sessionKey != null &&
                                <Grid.Row columns={1}>
                                    {/* <Grid.Column width="1" textAlign="right" floated='right'>
                                        <Button icon='step backward' onClick={this.handleBackSong} />
                                    </Grid.Column> */}
                                    <Grid.Column width="1">
                                        <Button icon='play' onClick={this.handlePlaySong} />
                                     </Grid.Column>
                                    {/* <Grid.Column width="1" textAlign="left" floated='left'>
                                        <Button icon='step forward' onClick={this.handleNextSong} />
                                    </Grid.Column> */}
                                </Grid.Row>
                            }
                            <Grid.Row centered columns={3}>
                                {
                                    this.state.tracks != null &&
                                    this.state.tracks.map((track, i) => {
                                        return (<Track key={i} track={track} playing={false} />)
                                    })
                                }
                            </Grid.Row>
                        </Grid>
                    </Container>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        )
    }
}

Session.propTypes = {
    playerLoaded: PropTypes.bool
}
