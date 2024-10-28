import React from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import ArtieWebcamRecorderComponent from '../components/artie-webcam-recorder/artie-webcam-recorder-component.jsx';
import {sendSensorInformation} from '../lib/artie-api';

class ArtieWebcamRecorder extends React.Component{
    constructor (props) {
        super(props);
        bindAll(this, ['onHandleSendSensorInformation', 'removeAllItems']);
    }
    componentWillMount () {
        this.removeAllItems();
    }
    componentWillUnmount () {
        this.removeAllItems();
    }

    onHandleSendSensorInformation (userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate) {
        sendSensorInformation(userName, password, student, sensorObjectType, sensorName, data, fromDate, toDate);
    }
    removeAllItems () {
        window.localStorage.removeItem('webcamRecorder_isRecording');
        window.localStorage.removeItem('webcamRecorder_props_recording');
        window.localStorage.removeItem('webcamRecorder_audioSource');
        window.localStorage.removeItem('webcamRecorder_videoSource');
        window.localStorage.removeItem('webcamRecorder_fromDate');
        window.localStorage.removeItem('webcamRecorder_toDate');
        window.localStorage.removeItem('webcamRecorder_error');
    }
    render () {
        if (this.props.artieLogin !== null &&
            this.props.artieLogin.user !== null && this.props.artieLogin.user.login !== null &&
            this.props.artieLogin.user.password !== null &&
            this.props.artieLogin.currentStudent !== null &&
            (this.props.artieLogin.currentStudent.recordFace === null ||
                this.props.artieLogin.currentStudent.recordFace)) {

            return (<ArtieWebcamRecorderComponent
                userName={this.props.artieLogin.user.login}
                password={this.props.artieLogin.user.password}
                student={this.props.artieLogin.currentStudent}
                sensorObjectType={'VIDEO'}
                sensorName={'SCRATCH_WEBCAM'}
                send={this.onHandleSendSensorInformation}
                artieWebcam={this.props.artieWebcam}
            />);
        }
        return null;
    }
}

const mapStateToProps = state => ({
    artieLogin: state.scratchGui.artieLogin,
    artieWebcam: state.scratchGui.artieWebcam
});
ArtieWebcamRecorder.propTypes = {
    artieLogin: PropTypes.object,
    artieWebcam: PropTypes.object
};

export default compose(
    connect(mapStateToProps)
)(ArtieWebcamRecorder);
