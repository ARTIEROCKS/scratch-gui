import PropTypes from 'prop-types';
import {useEffect, useRef, useState, forwardRef, useImperativeHandle} from 'react';

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

const ArtieWebcamRecorderComponent = forwardRef(({sendFunction}, ref) => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const mediaStreamRef = useRef(null);
    const recordingRef = useRef(false);
    const fromDateRef = useRef(null);

    useImperativeHandle(ref, () => ({
        stopRecording: () => {
            if (mediaRecorder && recordingRef.current) {
                mediaRecorder.stop();
                recordingRef.current = false;
            }
        },
        startRecording: () => {
            if (mediaRecorder && recordingRef.current) {
                mediaRecorder.start();
            }
        }
    }));

    useEffect(() => {

        if (!mediaRecorder && navigator.mediaDevices) {
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(stream => {
                    const recorder = new MediaRecorder(stream, options);
                    setMediaRecorder(recorder);
                    mediaStreamRef.current = stream;
                })
                .catch(error => {
                    console.error('Error accessing media devices.', error);
                });
        }
        // Cleanup function when component unmounts
        return () => {
            if (mediaRecorder && recordingRef.current) {
                mediaRecorder.stop();
                recordingRef.current = false;
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaRecorder]);

    useEffect(() => {
        if (mediaRecorder && !recordingRef.current) {
            recordingRef.current = true;
            fromDateRef.current = new Date();
            mediaRecorder.start();
            mediaRecorder.ondataavailable = e => {
                if (mediaRecorder && recordingRef.current && typeof sendFunction === 'function') {
                    const toDate = new Date();
                    sendFunction(e.data, formatDate(fromDateRef.current), formatDate(toDate));
                    fromDateRef.current = toDate;
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
});

ArtieWebcamRecorderComponent.propTypes = {
    sendFunction: PropTypes.func.isRequired
};

ArtieWebcamRecorderComponent.displayName = 'ArtieWebcamRecorderComponent';
export default ArtieWebcamRecorderComponent;
