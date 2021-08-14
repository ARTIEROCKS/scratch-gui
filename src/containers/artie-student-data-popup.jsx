import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import {defineMessages, injectIntl} from 'react-intl';
import {compose} from 'redux';
import {connect} from 'react-redux';

import ArtieStudentDataPopupComponent from '../components/artie-student-data/artie-student-data-popup.jsx';
import {updateStudentData} from '../lib/artie-api';
import {artieSetCurrentStudent} from '../reducers/artie-login';

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
        this.state = {
            gender: (this.props.student !== null && this.props.student.gender !== undefined && this.props.student.gender > 0 ? this.props.student.gender : 1),
            motherTongue: (this.props.student !== null && this.props.student.motherTongue !== undefined && this.props.student.motherTongue > 0 ? this.props.student.motherTongue : 2),
            age: (this.props.student !== null && this.props.student.age !== undefined && this.props.student.age > 0 ? this.props.student.age : 1)
        };
        bindAll(this, [
            'handleOnGenderChange',
            'handleOnMotherTongueChange',
            'handleOnOkClick',
            'handleStudentUpdated',
            'handleOnAgeChange',
            'handleOnCancelClick'
        ]);

        this.responsesGender = [{id: 1, value: this.props.intl.formatMessage(gender.boy)}, {id: 2, value: this.props.intl.formatMessage(gender.girl)}];
        this.responsesMotherTongue = [{id: 2, value: this.props.intl.formatMessage(motherTongue.yes)}, {id: 1, value: this.props.intl.formatMessage(motherTongue.no)}];
    }

    // Handler when the gender has been changed
    handleOnGenderChange (e){
        this.state.gender = e.target.value;
    }

    // Handler when the mother tongue has been changed
    handleOnMotherTongueChange (e){
        this.state.motherTongue = e.target.value;
    }

    // Handler when the age has been changed
    handleOnAgeChange (e){
        this.state.age = e.target.value;
    }

    handleOnOkClick (){
        if (this.state.gender !== null || this.state.motherTongue !== null) {
            updateStudentData(this.props.student.id, this.state.gender, this.state.motherTongue, this.state.age)
                .then(() => {
                    this.handleStudentUpdated();
                });
        }
    }
    handleStudentUpdated (){
        this.props.student.gender = this.state.gender;
        this.props.student.motherTongue = this.state.motherTongue;
        this.props.student.age = this.state.age;
        this.props.onArtieSetCurrentStudent(this.props.student);
    }

    handleOnCancelClick (){}

    render () {

        const showGender = (this.props.student !== null && (this.props.student.gender === undefined || this.props.student.gender === 0));
        const showMotherTongue = (this.props.student !== null && (this.props.student.motherTongue === undefined || this.props.student.motherTongue === 0));
        const showAge = (this.props.student !== null && (this.props.student.age === undefined || this.props.student.age === 0));

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
    onArtieSetCurrentStudent: currentStudent => dispatch(artieSetCurrentStudent(currentStudent))
});


ArtieStudentDataPopup.propTypes = {
    student: PropTypes.object.isRequired
};

export default compose(
    injectIntl,
    connect(
        null,
        mapDispatchToProps
    )
)(ArtieStudentDataPopup);
