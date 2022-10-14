import ArtieHelpPopupComponent from '../components/artie-help/artie-help-popup.jsx';
import {artieShowHelpPopup, artieAnswerHelpPopup, artieEmotionalStateChangeHelpPopup} from '../reducers/artie-help.js';
import {artieHelpReceived, artieLoadingHelp, artieResetSecondsHelpOpen} from '../reducers/artie-exercises.js';
import React from 'react';
import bindAll from 'lodash.bindall';
import {compose} from 'redux';
import {injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import {sendBlockArtie, updateAnsweredNeedHelp} from '../lib/artie-api.js';

class ArtieHelpPopup extends React.Component {

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

        if (this.props.artieHelp.id !== null){

            // 2.1- Automatic help request
            // We register the user option
            this.props.onAnswerHelpPopup(true, this.state.currentDateTime);
            // We update the information in database just in case when the answer in 'Yes'
            updateAnsweredNeedHelp(this.props.artieHelp.id, true).then(psd => {

                // We hide the popup once the user has been selected the desired option
                this.props.onHideHelpPopup(this.props.artieHelp.id);

                if (psd.solutionDistance !== null) {
                    // We show the help popup
                    this.props.onArtieHelpReceived(psd.solutionDistance, new Date());
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

                    // If the response has a solution distance object
                    if (responseBodyObject !== null && responseBodyObject.solutionDistance !== null){
                        this.props.onArtieHelpReceived(responseBodyObject.solutionDistance);
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
    }

    handleEmotionalStatusChanged (option) {
        this.props.onEmotionalStatusChanged(option.target.value);
    }

    render () {
        return (
            <ArtieHelpPopupComponent
                onYesClick={this.handleAnswerYes}
                onNoClick={this.handleAnswerNo}
                onEmotionalStatusChanged={this.handleEmotionalStatusChanged}
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
    onArtieResetSecondsHelpOpen: () => dispatch(artieResetSecondsHelpOpen())
});

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(ArtieHelpPopup);
