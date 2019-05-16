import React from 'react';
import { Sidebar, Grid, Segment, List, Input, Button } from 'semantic-ui-react';
import { PropTypes } from 'prop-types';
import axios from 'axios';

export default class SearchSideBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchVal: '',
            songs: []
        };
        this.search = this.search.bind(this);
        this.handleSearchValChange = this.handleSearchValChange.bind(this);
        this.handleSongClick = this.handleSongClick.bind(this);
    }

    search = () => {
        let input = this.state.searchVal;
        axios.get('http://localhost:5000/api/song/search?song=' + input,
        {
            withCredentials: true
        })
        .then(res => {
            this.setState({
                songs: res.data
            })
        })
    }

    handleSearchValChange = (e) => {
        this.setState({
            searchVal: e.target.value
        })
    }

    handleSongClick = (song) => {
        axios.post('http://localhost:5000/api/session/addsong', 
            { id: song.id },
            {
                withCredentials: true
            }    
        )
        .then(res => {
            //call parent to update songs on screen
            this.props.handleAddTrack();
        })
    }

    render() {
        let { sideBarVisible } = this.props;
        let { songs, searchVal } = this.state;
        return (
            <Sidebar as={Segment} animation='overlay' icon='labeled' inverted vertical visible={sideBarVisible} width='wide'>
                <Grid centered style={{margin: '0'}}>
                    <Grid.Row columns={1}>
                        <Input placeholder='Search...' onChange={this.handleSearchValChange} value={searchVal} />
                        <Button icon='search' onClick={this.search} />
                    </Grid.Row>
                    <Grid.Row>
                        <List divided style={{width: '90%'}}>
                        {
                            songs.map(song => {
                                return (
                                <List.Item key={song.id}>
                                    <List.Icon name='spotify' size='large' verticalAlign='middle' />
                                    <List.Content>
                                        <List.Header onClick={() => this.handleSongClick(song)}  as='a'>{song.name}</List.Header>
                                        <List.Description style={{color:'#00b5ad'}} as='p'>{song.artists[0].name}</List.Description>
                                    </List.Content>
                                </List.Item>
                                )
                            })
                        }
                        </List>
                    </Grid.Row>
                </Grid>
            </Sidebar>
        )
    }
}

SearchSideBar.propTypes = {
    sideBarVisible: PropTypes.bool,
    handleAddTrack: PropTypes.func
};
