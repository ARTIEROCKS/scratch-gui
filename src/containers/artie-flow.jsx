import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import ArtieLogin from '../components/artie-login/artie-login.jsx';
import ArtieStudentData from './artie-student-data-popup.jsx';
import ArtieExercises from '../components/artie-exercises/artie-exercises.jsx';
import ArtieHelp from './artie-help.jsx';
import ArtieEmotionalPopup from './artie-emotional-popup.jsx';
import ArtieExercisePopup from './artie-exercises-popup.jsx';

import {
    artieError,
    artieLogged,
    artieLogout,
    artieSetCurrentStudent,
    artieSetStudents,
    deactivateArtieLogin
} from '../reducers/artie-login';
import {
    getAllArtieExercises,
    getArtieExercises,
    getArtieStudents,
    getFinishedExercisesByStudentId,
    loginArtie
} from '../lib/artie-api';
import {
    artieSetFinishedExercises,
    artieSetExercises,
    deactivateArtieExercises,
    artieSetCurrentExercise,
    artieClearHelp,
    artieHelpReceived,
    artiePopupStatement
} from '../reducers/artie-exercises';
import {
    ARTIE_FLOW_LOGIN_STATE,
    ARTIE_FLOW_EXERCISES_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE,
    ARTIE_FLOW_STUDENT_DATA_STATE,
    ARTIE_FLOW_EMOTIONAL_STATE,
    ARTIE_FLOW_HELP_POPUP_STATE,
    artieChangeFlowState
} from '../reducers/artie-flow';
import {changeArtieWebcamRecording} from '../reducers/artie-webcam';
import {compose} from 'redux';
import {injectIntl} from 'react-intl';
import {SplitSdk} from '@splitsoftware/splitio-react';


// --- Login Component variables
let userLogin = null;
let passwordLogin = null;
let studentLogin = null;
let exerciseId = null;

class ArtieFlow extends React.Component {

    constructor (props) {
        super(props);
        bindAll(this, [
            'getCurrentStudent',
            'getCurrentExercise',
            'getPopupActivation',
            'handleArtieUserChange',
            'handleArtiePasswordChange',
            'handleArtieStudentChange',
            'handleClickArtieLoginOk',
            'handleArtieLogged',
            'handleArtieExerciseChange',
            'handleClickArtieExercisesOk',
            'handleLogout'
        ]);
    }

    /**
     * Function to get the current student
     * @param {object} artieLogin - The artieLogin object.
     * @returns {null|*|null} The current student or null if it doesn't exist.
     */
    getCurrentStudent (artieLogin){
        if (typeof artieLogin !== 'undefined' && artieLogin !== null){
            return artieLogin.currentStudent;
        }

        return null;
    }

    /**
     * Function to get the current exercise
     * @param {object} artieExercises - The artieExercises object.
     * @returns {object|null} - The current exercise or null if it doesn't exist.
     */
    getCurrentExercise (artieExercises){
        if (typeof artieExercises !== 'undefined' && artieExercises !== null){
            return artieExercises.currentExercise;
        }
        return null;

    }

    /**
     * Function to get if there must be the popup activated or not
     * @param {object} artieExercises - The artieExercises object.
     * @returns {boolean} - True if the popup should be activated, false otherwise.
     */
    getPopupActivation (artieExercises){
        return (typeof artieExercises !== 'undefined' && artieExercises !== null &&
                    (
                        artieExercises.evaluationStop ||
                        artieExercises.popupEvaluation || artieExercises.popupExercise ||
                        artieExercises.popupSolution ||
                        (artieExercises.help !== null && artieExercises.help.totalDistance === 0) ||
                        artieExercises.popupStatement
                    )
        );
    }

    // -----0- Generic Component Handlers---------
    handleLogout (){
        this.props.onArtieLogout();
        this.props.onArtieStateFlowChange(ARTIE_FLOW_LOGIN_STATE);
    }

    handleSplitIO (userId, featureFlag){
        const splitFactory = SplitSdk({
            core: {
                authorizationKey: 'aabooomno9lpi60pp8rp29i3jdacfo0ve40',
                key: '1c3b0c90-9d15-11ee-9115-1afcd9bd52af'
            }
        });
        const splitClient = splitFactory.client(userId);
        splitClient.on(splitClient.Event.SDK_READY, () => {
            this.props.onArtieFeatureFlagLoaded('Emotional_Popup', splitClient.getTreatment(featureFlag));
        });
    }

    // -----1- Login Component Handlers---------
    handleArtieUserChange (e){
        userLogin = e.target.value;
    }

    handleArtiePasswordChange (e){
        passwordLogin = e.target.value;
    }

    handleArtieStudentChange (e){
        studentLogin = e.target.value;
    }

    handleClickArtieLoginOk (){

        // If the user is not yet logged
        if (this.props.artieLogin.user === null || (this.props.artieLogin.user.role === 0 &&
            this.props.artieLogin.students.length === 0)){
            loginArtie(userLogin, passwordLogin)
                .then(user => {
                    this.handleArtieLogged(user);
                })
                .catch(error => {
                    this.props.onArtieError(error);
                });
        } else {
            if (studentLogin !== ''){
                const tempStudent = this.props.artieLogin.students.filter(s => s.id === studentLogin)[0];
                this.props.onArtieSetCurrentStudent(tempStudent);

                // We get the feature flag
                this.handleSplitIO(tempStudent.id, 'Emotional_Popup');

                // Once the student has been selected, we start recording
                this.props.onChangeArtieWebcamRecording(true);

                // If the student does not have the age, gender or mother tongue, we show the student data component
                if (tempStudent.age === 0 || tempStudent.gender === 0 || tempStudent.motherTongue === 0){
                    // Get the evaluation exercises
                    getArtieExercises(userLogin, passwordLogin, true)
                        .then(exercises => {
                            this.props.onArtieSetExercises(exercises);
                        });
                    // FLOW Changes to show the student data component
                    this.props.onArtieStateFlowChange(ARTIE_FLOW_STUDENT_DATA_STATE);
                } else if (typeof tempStudent.competence !== 'undefined' && tempStudent.competence !== null &&
                    tempStudent.competence > 0){

                    // If the current user is not null and the competence is already set, we show the exercises
                    // Updates the list of exercises that the student has completed
                    getFinishedExercisesByStudentId(tempStudent.id)
                        .then(finishedExercises => {
                            this.props.onArtieSetFinishedExercises(finishedExercises);
                        });

                    // Get the exercises
                    getArtieExercises(userLogin, passwordLogin, false)
                        .then(exercises => {
                            this.props.onArtieSetExercises(exercises);
                            
                            // FLOW Changes to show the exercise list
                            this.props.onArtieStateFlowChange(ARTIE_FLOW_EXERCISES_STATE);
                        });
                } else {
                    // Get the evaluations
                    getArtieExercises(userLogin, passwordLogin, true)
                        .then(exercises => {
                            this.props.onArtieSetExercises(exercises);
                        });
                    // FLOW Changes to show the exercise list
                    this.props.onArtieStateFlowChange(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
                }
            }

            // And we close the login window
            this.props.onDeactivateArtieLogin();
        }
    }

    handleArtieLogged (user){

        // Gets the datetime
        const options = {year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'};
        const date = new Date().toLocaleDateString('es-ES', options);
        this.props.onArtieLogged(user, date);

        // If the user role is admin, we load all the exercises (evaluations and normals)
        if (user.role !== null && user.role === 1){
            // Get all the exercises
            getAllArtieExercises(userLogin, passwordLogin)
                .then(exercises => {
                    this.props.onArtieSetExercises(exercises);
                });
        }

        // If the user is read only, we check for the students
        if (user !== null && user.role === 0){
            // We get the students
            getArtieStudents(userLogin, passwordLogin)
                .then(students => {
                    this.props.onArtieSetStudents(students);
                });
        } else if (user !== null && user.role === 1){
            // We close the login window
            this.props.onDeactivateArtieLogin();
        }
    }
    // ------------------------------------

    // -----2- Exercises Component Handlers---------
    handleArtieExerciseChange (e){
        exerciseId = e.target.value;
    }

    handleClickArtieExercisesOk (){
        // Searches for the exercise object in base of the exerciseId selected
        const exercise = this.props.artieExercises.exercises.filter(e => e.id === exerciseId)[0];
        const options = {year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'};
        const date = new Date().toLocaleDateString('es-ES', options);
        this.props.onArtieSetCurrentExercise(exercise, date);
        this.props.onDeactivateArtieExercises();

        // FLOW changes to show the popup with the statement
        this.props.onArtieStateFlowChange(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
        this.props.onArtiePopupStatement(true);
    }
    // ------------------------------------

    render (){

        // 1- Checks if the component must show the login component or not
        if (this.props.artieFlow.flowState === ARTIE_FLOW_LOGIN_STATE){
            return (<ArtieLogin
                onUserChange={this.handleArtieUserChange}
                onPasswordChange={this.handleArtiePasswordChange}
                onStudentChange={this.handleArtieStudentChange}
                onCancel={this.handleLogout}
                onOk={this.handleClickArtieLoginOk}
                title="Login"
                artieLogin={this.props.artieLogin}
            />);
        }

        // 2- Checks if the component must show the student data component or not
        if (this.props.artieFlow.flowState === ARTIE_FLOW_STUDENT_DATA_STATE){
            return <ArtieStudentData student={this.props.artieLogin.currentStudent} />;
        }

        // 3- Checks if the component must show the exercise component or not
        if (this.props.artieFlow.flowState === ARTIE_FLOW_EXERCISES_STATE){
            return (<ArtieExercises
                title="Exercise Selector"
                onExerciseChange={this.handleArtieExerciseChange}
                onLogout={this.handleLogout}
                onDeactivate={this.props.onDeactivateArtieExercises}
                onOk={this.handleClickArtieExercisesOk}
                artieExercises={this.props.artieExercises}
                artieLogin={this.props.artieLogin}
            />);
        }

        // 4- Checks if the component must show the help component or not
        if (this.props.artieFlow.flowState === ARTIE_FLOW_HELP_POPUP_STATE){
            return (<ArtieHelp
                onRequestClose={this.props.onArtieClearHelp}
                artieLogin={this.props.artieLogin}
                artieExercises={this.props.artieExercises}
                help={this.props.artieExercises.help}
            />);
        }


        // 5- Checks if the component must show the popup or not
        if (this.props.artieFlow.flowState === ARTIE_FLOW_EXERCISE_STATEMENT_STATE){
            return (<ArtieExercisePopup
                userLogin={userLogin}
                passwordLogin={passwordLogin}
            />);
        }

        // 6- Checks if the component must show the help popup or not
        // ARTIE-TODO: lastHelpRequest > 2 minutes
        if (this.props.artieFlow.flowState === ARTIE_FLOW_EMOTIONAL_STATE){
            return (<ArtieEmotionalPopup />);
        }

        return null;

    }
}

const mapStateToProps = state => ({
    artieLogin: state.scratchGui.artieLogin,
    artieExercises: state.scratchGui.artieExercises,
    artieHelp: state.scratchGui.artieHelp,
    artieFlow: state.scratchGui.artieFlow,
    sprites: state.scratchGui.targets.sprites
});

const mapDispatchToProps = dispatch => ({

    // 1- Login Properties
    onArtieLogged: (user, date) => dispatch(artieLogged(user, date)),
    onArtieLogout: () => dispatch(artieLogout()),
    onArtieError: error => dispatch(artieError(error)),
    onDeactivateArtieLogin: () => dispatch(deactivateArtieLogin()),
    onArtieSetStudents: students => dispatch(artieSetStudents(students)),
    onArtieSetCurrentStudent: currentStudent => dispatch(artieSetCurrentStudent(currentStudent)),

    // 2- Exercises properties
    onArtieSetExercises: exercises => dispatch(artieSetExercises(exercises)),
    onArtieSetFinishedExercises: finishedExercises => dispatch(artieSetFinishedExercises(finishedExercises)),
    onDeactivateArtieExercises: () => dispatch(deactivateArtieExercises()),
    onArtieSetCurrentExercise: (currentExercise, date) => dispatch(artieSetCurrentExercise(currentExercise, date)),
    onArtiePopupStatement: active => dispatch(artiePopupStatement(active)),

    // 3- Help properties
    onArtieClearHelp: () => dispatch(artieClearHelp(new Date())),
    onArtieHelpReceived: help => dispatch(artieHelpReceived(help)),

    // 4- Webcam properties
    onChangeArtieWebcamRecording: recording => dispatch(changeArtieWebcamRecording(recording)),

    // 5- Flow properties
    onArtieStateFlowChange: state => dispatch(artieChangeFlowState(state))
});

ArtieFlow.propTypes = {
    artieFlow: PropTypes.shape({
        flowState: PropTypes.string.isRequired
    }).isRequired,

    artieLogin: PropTypes.object.isRequired,

    onArtieLogout: PropTypes.func.isRequired,
    onArtieError: PropTypes.func.isRequired,
    onDeactivateArtieLogin: PropTypes.func.isRequired,
    onArtieSetCurrentStudent: PropTypes.func.isRequired,
    onChangeArtieWebcamRecording: PropTypes.func.isRequired,
    onArtieLogged: PropTypes.func.isRequired,

    artieExercises: PropTypes.object.isRequired,
    onDeactivateArtieExercises: PropTypes.func.isRequired,
    onArtieSetCurrentExercise: PropTypes.func.isRequired,
    onArtiePopupStatement: PropTypes.func.isRequired,
    onArtieSetExercises: PropTypes.func.isRequired,
    onArtieSetFinishedExercises: PropTypes.func.isRequired,
    onArtieClearHelp: PropTypes.func.isRequired,
    onArtieSetStudents: PropTypes.func.isRequired,

    // Flow functions
    onArtieStateFlowChange: PropTypes.func.isRequired,

    // Split IO Functions
    onArtieFeatureFlagLoaded: PropTypes.func
};

ArtieLogin.propTypes = {
    onUserChange: PropTypes.func.isRequired,
    onPasswordChange: PropTypes.func.isRequired,
    onStudentChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onOk: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    artieLogin: PropTypes.object.isRequired
};

export default compose(
    injectIntl,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(ArtieFlow);
