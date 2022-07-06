import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import ArtieExercisesComponent from '../components/artie-exercises/artie-exercises.jsx';

class ArtieExercises extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, []);
        this.state = {
            artieExercises: null,
            evaluation: false
        };
    }
    componentWillReceiveProps (newProps) {

        if(this.state.artieExercises !== newProps.artieExercises){
            this.setState({
                artieExercises: newProps.artieExercises
            });
        }

        if(this.state.evaluation !== newProps.evaluation){
            this.setState({
                evaluation: newProps.evaluation
            });
        }
    }

    render () {
        return(
            <ArtieExercisesComponent
                onOk={this.props.onOk}
                onCancel={this.props.onCancel}
                onExerciseChange={this.props.onExerciseChange}
                title={this.props.title}
                artieExercises={this.state.artieExercises}
            />
        );
    }
}

ArtieExercises.propTypes = {
    onExerciseChange: PropTypes.func,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    artieExercises: PropTypes.object,
    evaluation: PropTypes.bool.isRequired
}

export default ArtieExercises;
