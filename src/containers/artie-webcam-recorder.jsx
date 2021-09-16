import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import bindAll from 'lodash.bindall';
import ArtieWebcamRecorderComponent from "../components/artie-webcam-recorder/artie-webcam-recorder-component.jsx";
import {sendSensorInformation} from "../lib/artie-api";

class ArtieWebcamRecorder extends React.Component{
    constructor (props) {
        super(props);
        bindAll(this, ['handleSendSensorInformation']);
    }
    handleSendSensorInformation (userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate) {
        sendSensorInformation(userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate);
    }
    render () {
        return <ArtieWebcamRecorderComponent {...this.props.artieLogin, this.handleSendSensorInformation}/>;
    }
}

const mapStateToProps = state => ({
    artieLogin: state.scratchGui.artieLogin
});

export default compose(
    connect(mapStateToProps)
)(ArtieWebcamRecorder);
