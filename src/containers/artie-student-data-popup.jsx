import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {defineMessages, injectIntl} from 'react-intl';
import {compose} from 'redux';
import {connect} from 'react-redux';

import ArtieStudentDataPopupComponent from '../components/artie-student-data/artie-student-data-popup.jsx';
import {updateStudentData} from '../lib/artie-api';
import {artieSetCurrentStudent} from '../reducers/artie-login';
import {
    artieExercisesState,
    artieExerciseStatementState
} from '../reducers/artie-flow';

const gender = defineMessages({
    boy: {
        defaultMessage: 'Boy',
        description: 'Boy',
        id: 'gui.artie.data.gender.boy'
    },
    girl: {
        defaultMessage: 'Girl',
        description: 'Girl',
        id: 'gui.artie.data.gender.girl'
    }
});

const motherTongue = defineMessages({
    yes: {
        defaultMessage: 'Yes',
        description: 'Yes',
        id: 'gui.artie.yes'
    },
    no: {
        defaultMessage: 'No',
        description: 'No',
        id: 'gui.artie.no'
    }
});


class ArtieStudentDataPopup extends React.Component {

    constructor (props) {
        super(props);
        
        const studentGender = (this.props.student !== null && typeof this.props.student.gender !== 'undefined' &&
            this.props.student.gender > 0 ? this.props.student.gender : 1);
        const studentMotherTongue = (this.props.student !== null &&
            typeof this.props.student.motherTongue !== 'undefined' &&
            this.props.student.motherTongue > 0 ? this.props.student.motherTongue : 2);
        const studentAge = (this.props.student !== null && typeof this.props.student.age !== 'undefined' &&
            this.props.student.age > 0 ? this.props.student.age : 1);

        bindAll(this, [
            'handleOnGenderChange',
            'handleOnMotherTongueChange',
            'handleOnOkClick',
            'handleStudentUpdated',
            'handleOnAgeChange',
            'handleOnCancelClick'
        ]);

        this.responsesGender = [{id: 1, value: this.props.intl.formatMessage(gender.boy)},
            {id: 2, value: this.props.intl.formatMessage(gender.girl)}];
        this.responsesMotherTongue = [{id: 2, value: this.props.intl.formatMessage(motherTongue.yes)},
            {id: 1, value: this.props.intl.formatMessage(motherTongue.no)}];
    }

    // Handler when the gender has been changed
    handleOnGenderChange (e){
        this.studentGender = e.target.value;
    }

    // Handler when the mother tongue has been changed
    handleOnMotherTongueChange (e){
        this.studentMotherTongue = e.target.value;
    }

    // Handler when the age has been changed
    handleOnAgeChange (e){
        this.studentAge = e.target.value;
    }

    handleOnOkClick (){
        if (this.studentGender !== null || this.studentMotherTongue !== null) {
            updateStudentData(this.props.student.id, this.studentGender, this.studentMotherTongue, this.studentAge)
                .then(() => {
                    this.handleStudentUpdated();
                });
        }
    }
    handleStudentUpdated (){
        this.props.student.gender = this.studentGender;
        this.props.student.motherTongue = this.studentMotherTongue;
        this.props.student.age = this.studentAge;
        this.props.onArtieSetCurrentStudent(this.props.student, Date.now());

        // Once the student data has been updated, we can move to the next state
        if (this.props.student.competence > 0){
            // We show the exercises
            this.props.onArtieExercisesState();
        } else {
            // we show the evaluation
            this.props.onArtieExerciseStatementState();
        }
    }

    handleOnCancelClick (){}

    render () {

        const showGender = (this.props.student !== null &&
            (typeof this.props.student.gender === 'undefined' || this.props.student.gender === 0));
        const showMotherTongue = (this.props.student !== null &&
            (typeof this.props.student.motherTongue === 'undefined' || this.props.student.motherTongue === 0));
        const showAge = (this.props.student !== null &&
            (typeof this.props.student.age === 'undefined' || this.props.student.age === 0));

        if (showGender || showMotherTongue || showAge) {
            return (
                <ArtieStudentDataPopupComponent
                    onOk={this.handleOnOkClick}
                    onCancel={this.handleOnCancelClick}
                    genderResponses={this.responsesGender}
                    onGenderChange={this.handleOnGenderChange}
                    showGender={showGender}
                    showMotherTongue={showMotherTongue}
                    motherTongueResponses={this.responsesMotherTongue}
                    onMotherTongueChange={this.handleOnMotherTongueChange}
                    showAge={showAge}
                    onAgeChange={this.handleOnAgeChange}
                    title="Student Data"
                />
            );
        }
        return null;

    }
}

const mapDispatchToProps = dispatch => ({
    onArtieSetCurrentStudent: currentStudent => dispatch(artieSetCurrentStudent(currentStudent)),
    onArtieExercisesState: () => dispatch(artieExercisesState()),
    onArtieExerciseStatementState: () => dispatch(artieExerciseStatementState())
});


ArtieStudentDataPopup.propTypes = {
    student: PropTypes.object.isRequired,
    intl: PropTypes.shape({
        formatMessage: PropTypes.func.isRequired
    }).isRequired,
    onArtieSetCurrentStudent: PropTypes.func.isRequired,
    onArtieExercisesState: PropTypes.func.isRequired,
    onArtieExerciseStatementState: PropTypes.func.isRequired
};

export default compose(
    injectIntl,
    connect(
        null,
        mapDispatchToProps
    )
)(ArtieStudentDataPopup);
