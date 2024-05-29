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
    ARTIE_FLOW_EXERCISES_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE,
    artieChangeFlowState
} from '../reducers/artie-flow';

const defaultGender = 1;
const defaultMotherTongue = 2;
const defaultAge = 1;

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
            this.props.student.gender > 0 ? this.props.student.gender : defaultGender);
        const studentMotherTongue = (this.props.student !== null &&
            typeof this.props.student.motherTongue !== 'undefined' &&
            this.props.student.motherTongue > 0 ? this.props.student.motherTongue : defaultMotherTongue);
        const studentAge = (this.props.student !== null && typeof this.props.student.age !== 'undefined' &&
            this.props.student.age > 0 ? this.props.student.age : defaultAge);

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

        this.studentGender = this.studentGender ?? defaultGender;
        this.studentMotherTongue = this.studentMotherTongue ?? defaultMotherTongue;
        this.studentAge = this.studentAge ?? defaultAge;

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
            this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISES_STATE);
        } else {
            // we show the evaluation
            this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
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
    onArtieChangeFlowState: state => dispatch(artieChangeFlowState(state))
});


ArtieStudentDataPopup.propTypes = {
    student: PropTypes.object.isRequired,
    intl: PropTypes.shape({
        formatMessage: PropTypes.func.isRequired
    }).isRequired,
    onArtieSetCurrentStudent: PropTypes.func.isRequired,
    onArtieChangeFlowState: PropTypes.func.isRequired
};

export default compose(
    injectIntl,
    connect(
        null,
        mapDispatchToProps
    )
)(ArtieStudentDataPopup);
