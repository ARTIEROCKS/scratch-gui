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

const options = {mimeType: 'video/webm;codecs=vp9'};
const constraints = {audio: true, video: true};

const ArtieWebcamRecorderComponent = forwardRef(({sendFunction}, ref) => {
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const mediaStreamRef = useRef(null);
    const recordingRef = useRef(false);
    const fromDateRef = useRef(null);

    useImperativeHandle(ref, () => ({
        stopRecording: () => {
            if (mediaRecorder && recordingRef.current !== null) {
                mediaRecorder.stop();
                recordingRef.current = false;
            }
        },
        startRecording: () => {
            if (mediaRecorder && !recordingRef.current !== null) {
                mediaRecorder.start();
                recordingRef.current = true;
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
            if (mediaRecorder && recordingRef.current !== null) {
                mediaRecorder.stop();
                recordingRef.current = false;
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
                if (mediaRecorder && typeof sendFunction === 'function') {
                    const toDate = new Date();
                    const reader = new FileReader();
                    reader.onload = function () {
                        const jsonBlob = reader.result;
                        sendFunction(jsonBlob, formatDate(fromDateRef.current), formatDate(toDate));
                        fromDateRef.current = toDate;
                    };
                    reader.readAsDataURL(e.data);
                }
            };
        }

        const intervalStop = setInterval(() => {
            if (mediaRecorder && recordingRef.current !== null && recordingRef.current) {
                mediaRecorder.stop();
                recordingRef.current = false;
            }
        }, 5000);

        const intervalStart = setInterval(() => {
            if (mediaRecorder && recordingRef.current !== null && !recordingRef.current) {
                mediaRecorder.start();
                recordingRef.current = true;
            }
        }, 25000);

        return () => {
            clearInterval(intervalStop);
            clearInterval(intervalStart);
        };
    }, [mediaRecorder, sendFunction]);

    return null;
});

ArtieWebcamRecorderComponent.propTypes = {
    sendFunction: PropTypes.func.isRequired
};

ArtieWebcamRecorderComponent.displayName = 'ArtieWebcamRecorderComponent';
export default ArtieWebcamRecorderComponent;
