import React from 'react';
import axios from 'axios';
import { Grid, Button, Sidebar, Segment, Input, List } from 'semantic-ui-react';
import Track from '../presentational/Track.jsx';

export default class Session extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tracks: null,
            sessionKey: null,
            sideBarVisible: false
        }
        this.handleStartSession = this.handleStartSession.bind(this);
        this.handleToggleSearch = this.handleToggleSearch.bind(this);
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

    handleToggleSearch = () => {
        let sideBarVisible = !this.state.sideBarVisible;
        this.setState({ sideBarVisible });
    }

    render() {
        let { sideBarVisible } = this.state;
        return (
            <Sidebar.Pushable>
                <Sidebar as={Segment} animation='overlay' icon='labeled' vertical visible={sideBarVisible} width='wide'>
                    <Grid centered style={{margin: '0'}}>
                        <Grid.Row columns={1}>
                            <Input placeholder='Search...' />
                        </Grid.Row>
                        <Grid.Row>
                            <List divided style={{width: '90%'}}>
                                <List.Item>
                                <List.Icon name='spotify' size='large' verticalAlign='middle' />
                                <List.Content>
                                    <List.Header as='a'>Semantic-Org/Semantic-UI</List.Header>
                                    <List.Description as='a'>Updated 10 mins ago</List.Description>
                                </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Icon name='spotify' size='large' verticalAlign='middle' />
                                <List.Content>
                                    <List.Header as='a'>Semantic-Org/Semantic-UI-Docs</List.Header>
                                    <List.Description as='a'>Updated 22 mins ago</List.Description>
                                </List.Content>
                                </List.Item>
                                <List.Item>
                                <List.Icon name='spotify' size='large' verticalAlign='middle' />
                                <List.Content>
                                    <List.Header as='a'>Semantic-Org/Semantic-UI-Meteor</List.Header>
                                    <List.Description as='a'>Updated 34 mins ago</List.Description>
                                </List.Content>
                                </List.Item>
                            </List>
                        </Grid.Row>
                    </Grid>
                </Sidebar>

                <Sidebar.Pusher>
                    <Grid textAlign='center' columns={1}>
                        <Grid.Row></Grid.Row>
                        <Grid.Row>
                            <h4>Logged In</h4>
                        </Grid.Row>
                        <Grid.Row centered columns={1}>
                        {
                            this.state.sessionKey == null ?
                            <Button onClick={this.handleStartSession}>Start Session</Button> :
                            <Button icon='search' onClick={this.handleToggleSearch} />
                        }
                        </Grid.Row>
                        {
                            this.state.sessionKey != null &&
                            <Grid.Row>
                                <h3>{`You Session Key: ${this.state.sessionKey}`}</h3>
                            </Grid.Row>
                        }
                        <Grid.Row centered columns={3}>
                            {
                                this.state.tracks != null &&
                                this.state.tracks.map((track, i) => {
                                    return (<Track key={i} track={track} onClickHandler={this.handleOnclickTrack} playing={false} />)
                                })
                            }
                        </Grid.Row>
                    </Grid>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        )
    }
}
