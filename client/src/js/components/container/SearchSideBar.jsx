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

    render() {
        let { sideBarVisible } = this.props;
        let { songs, searchVal } = this.state;
        return (
            <Sidebar as={Segment} animation='overlay' icon='labeled' vertical visible={sideBarVisible} width='wide'>
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
                                <List.Item>
                                    <List.Icon name='spotify' size='large' verticalAlign='middle' />
                                    <List.Content>
                                        <List.Header as='a'>{song.name}</List.Header>
                                        <List.Description as='a'>{song.artists[0].name}</List.Description>
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

Input.propTypes = {
    sideBarVisible: PropTypes.bool
};
