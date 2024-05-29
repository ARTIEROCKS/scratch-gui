import ArtieEmotionalPopupComponent from '../components/artie-help/artie-emotional-popup.jsx';
import {artieShowHelpPopup, artieAnswerHelpPopup, artieEmotionalStateChangeHelpPopup} from '../reducers/artie-help.js';
import {artieHelpReceived, artieLoadingHelp, artieResetSecondsHelpOpen} from '../reducers/artie-exercises.js';
import {
    artieChangeFlowState,
    ARTIE_FLOW_WORKSPACE_STATE,
    ARTIE_FLOW_HELP_POPUP_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE
} from '../reducers/artie-flow.js';
import React from 'react';
import bindAll from 'lodash.bindall';
import {compose} from 'redux';
import {injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import {sendBlockArtie, updateAnsweredNeedHelp} from '../lib/artie-api.js';
import PropTypes from 'prop-types';

class ArtieEmotionalPopup extends React.Component {

    constructor (props) {
        super(props);
        this.state = {
            currentDateTime: Date().toLocaleString()
        };
        bindAll(this, [
            'handleAnswerYes',
            'handleAnswerNo',
            'handleEmotionalStatusChanged'
        ]);
    }

    handleAnswerYes () {

        // 1- Loading help
        this.props.onArtieLoadingHelp(true);

        // eslint-disable-next-line no-negated-condition
        if (this.props.artieHelp.id !== null) {

            // 2.1- Automatic help request
            // We register the user option
            this.props.onAnswerHelpPopup(true, this.state.currentDateTime);
            // We update the information in database just in case when the answer in 'Yes'
            updateAnsweredNeedHelp(this.props.artieHelp.id, true).then(psd => {

                // We hide the popup once the user has been selected the desired option
                this.props.onHideHelpPopup(this.props.artieHelp.id);
                this.props.onArtieChangeFlowState(ARTIE_FLOW_WORKSPACE_STATE);

                if (psd.solutionDistance !== null) {
                    // We show the help popup
                    this.props.onArtieHelpReceived(psd.solutionDistance, new Date());

                    if (psd.solutionDistance.totalDistance === 0) {
                        this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
                    } else {
                        this.props.onArtieChangeFlowState(ARTIE_FLOW_HELP_POPUP_STATE);
                    }
                }

                this.props.onArtieLoadingHelp(false);
            });
        } else {

            // 2.2- Manual help request
            sendBlockArtie(this.props.artieLogin.currentStudent, this.props.sprites,
                this.props.artieExercises.currentExercise, true, this.props.artieHelp.emotionalState,
                this.props.artieExercises.secondsHelpOpen, false, this.props.artieLogin.lastLogin,
                this.props.artieExercises.lastExerciseChange, null, null)
                .then(responseBodyObject => {

                    // We hide the popup once the user has been selected the desired option
                    this.props.onHideHelpPopup(this.props.artieHelp.id);
                    this.props.onArtieChangeFlowState(ARTIE_FLOW_WORKSPACE_STATE);

                    // If the response has a solution distance object
                    if (responseBodyObject !== null && responseBodyObject.solutionDistance !== null){
                        this.props.onArtieHelpReceived(responseBodyObject.solutionDistance);
                        if (responseBodyObject.solutionDistance.totalDistance === 0) {
                            this.props.onArtieChangeFlowState(ARTIE_FLOW_HELP_POPUP_STATE);
                        } else {
                            this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
                        }
                    }

                    // Stops the loading help
                    this.props.onArtieLoadingHelp(false);
                });
            if (this.props.artieExercises.secondsHelpOpen > 0) {
                this.props.onArtieResetSecondsHelpOpen();
            }
        }

        // Resets the emotional state
        this.props.onEmotionalStatusChanged(null);
    }

    handleAnswerNo () {
        // We register the user option
        this.props.onAnswerHelpPopup(false, this.state.currentDateTime);
        // We hide the popup once the user has been selected the desired option
        this.props.onHideHelpPopup(this.props.artieHelp.id);
        this.props.onArtieChangeFlowState(ARTIE_FLOW_WORKSPACE_STATE);
    }

    handleEmotionalStatusChanged (option) {
        this.props.onEmotionalStatusChanged(option.target.value);
    }

    render () {
        return (
            <ArtieEmotionalPopupComponent
                onYesClick={this.handleAnswerYes}
                onNoClick={this.handleAnswerNo}
                onEmotionalStatusChanged={this.handleEmotionalStatusChanged}
                emotionalStateChecked={this.props.artieHelp.emotionalState === null ||
                    this.props.artieHelp.emotionalState === 'neutral'}
            />
        );
    }
}

const mapStateToProps = state => ({
    artieHelp: state.scratchGui.artieHelp,
    artieExercises: state.scratchGui.artieExercises,
    artieLogin: state.scratchGui.artieLogin,
    sprites: state.scratchGui.targets.sprites
});

const mapDispatchToProps = dispatch => ({
    onAnswerHelpPopup: (answer, datetime) => dispatch(artieAnswerHelpPopup(answer, datetime)),
    onHideHelpPopup: id => dispatch(artieShowHelpPopup(id, false)),
    onArtieHelpReceived: (help, date) => dispatch(artieHelpReceived(help, date)),
    onEmotionalStatusChanged: emotionalState => dispatch(artieEmotionalStateChangeHelpPopup(emotionalState)),
    onArtieLoadingHelp: loading => dispatch(artieLoadingHelp(loading)),
    onArtieResetSecondsHelpOpen: () => dispatch(artieResetSecondsHelpOpen()),
    onArtieChangeFlowState: state => dispatch(artieChangeFlowState(state))
});

ArtieEmotionalPopup.propTypes = {
    artieHelp: PropTypes.object.isRequired,
    artieExercises: PropTypes.object.isRequired,
    artieLogin: PropTypes.object.isRequired,
    sprites: PropTypes.object.isRequired,
    onAnswerHelpPopup: PropTypes.func.isRequired,
    onHideHelpPopup: PropTypes.func.isRequired,
    onArtieHelpReceived: PropTypes.func.isRequired,
    onEmotionalStatusChanged: PropTypes.func.isRequired,
    onArtieLoadingHelp: PropTypes.func.isRequired,
    onArtieResetSecondsHelpOpen: PropTypes.func.isRequired,
    onArtieChangeFlowState: PropTypes.func.isRequired
};

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(ArtieEmotionalPopup);
