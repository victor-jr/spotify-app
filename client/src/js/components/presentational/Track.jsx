import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Image } from 'semantic-ui-react';

const Track = ({ track, onClickHandler, playing }) => {
    return (
        <Grid.Column>
            <Image onClick={() => onClickHandler(id)} style={{opacity: track.opacity}} src={track.album.images[1].url} />
        </Grid.Column>
    )
}

Track.propTypes = {
    track: PropTypes.object.isRequired,
    onClickHandler: PropTypes.func.isRequired,
    playing: PropTypes.bool.isRequired
}

export default Track;