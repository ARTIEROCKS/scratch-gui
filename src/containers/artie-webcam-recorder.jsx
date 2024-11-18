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
        bindAll(this, ['onHandleSendSensorInformation']);
        this.recorderRef = React.createRef();
    }

    componentDidUpdate (prevProps) {
        if (prevProps.artieWebcam.recording && !this.props.artieWebcam.recording && this.recorderRef.current !== null) {
            this.recorderRef.current.stopRecording();
        }
    }

    onHandleSendSensorInformation (data, fromDate, toDate) {
        sendSensorInformation(this.props.artieLogin.user.login, this.props.artieLogin.user.password,
            this.props.artieLogin.currentStudent, 'VIDEO', 'SCRATCH_WEBCAM', data, fromDate, toDate);
    }

    render () {
        if (this.props.artieLogin !== null &&
            this.props.artieLogin.user !== null && this.props.artieLogin.user.login !== null &&
            this.props.artieLogin.user.password !== null &&
            this.props.artieLogin.currentStudent !== null &&
            (this.props.artieLogin.currentStudent.recordFace === null ||
                this.props.artieLogin.currentStudent.recordFace)) {

            return (<ArtieWebcamRecorderComponent
                ref={this.recorderRef}
                sendFunction={this.onHandleSendSensorInformation}
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
