import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Image } from 'semantic-ui-react';

const Track = ({ track, playing }) => {
    return (
        <Grid.Column>
            <Image style={{opacity: track.opacity, marginBottom: '1em'}} src={track.album.images[1].url} />
        </Grid.Column>
    )
}

Track.propTypes = {
    track: PropTypes.object.isRequired,
    playing: PropTypes.bool.isRequired
}

export default Track;