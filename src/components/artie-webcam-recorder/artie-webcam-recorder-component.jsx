import PropTypes from 'prop-types';
import {useEffect, useRef, useState} from 'react';

const formatDate = date => date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
});

const options = {mimeType: 'video/webm'};
const constraints = {audio: true, video: true};

const ArtieWebcamRecorderComponent = ({sendFunction}) => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const recordingRef = useRef(false);

    useEffect(() => {
        if (!mediaRecorder && navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(stream => {
                    const recorder = new MediaRecorder(stream, options);
                    setMediaRecorder(recorder);
                })
                .catch(error => {
                    console.error('Error accessing media devices.', error);
                });
        }
    }, [mediaRecorder]);

    useEffect(() => {
        if (mediaRecorder && !recordingRef.current) {
            recordingRef.current = true;
            mediaRecorder.start();
            mediaRecorder.ondataavailable = e => {
                if (typeof sendFunction === 'function') {
                    sendFunction(e.data);
                }
            };
        }

        const interval = setInterval(() => {
            if (mediaRecorder && recordingRef.current) {
                mediaRecorder.requestData();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [mediaRecorder, sendFunction]);

    return null;
};

ArtieWebcamRecorderComponent.propTypes = {
    sendFunction: PropTypes.func.isRequired
};

export default ArtieWebcamRecorderComponent;
