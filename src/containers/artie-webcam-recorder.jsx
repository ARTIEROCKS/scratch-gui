import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import bindAll from 'lodash.bindall';
import ArtieWebcamRecorderComponent from "../components/artie-webcam-recorder/artie-webcam-recorder-component.jsx";
import {sendSensorInformation} from "../lib/artie-api";

class ArtieWebcamRecorder extends React.Component{
    constructor (props) {
        super(props);
        bindAll(this, ['onHandleSendSensorInformation']);
    }
    onHandleSendSensorInformation (userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate) {
        sendSensorInformation(userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate);
    }
    render () {
        return (<ArtieWebcamRecorderComponent
            userName={this.props.login}
            password={this.props.password}
            student={this.props.artieLogin.currentStudent}
            sensorObjectType={'VIDEO'}
            sensorName={'SCRATCH_WEBCAM'}
            send={this.onHandleSendSensorInformation}
            artieWebcam={this.props.artieWebcam}
        />);
    }
}

const mapStateToProps = state => ({
    artieLogin: state.scratchGui.artieLogin,
    artieWebcam: state.scratchGui.artieWebcam
});

export default compose(
    connect(mapStateToProps)
)(ArtieWebcamRecorder);
