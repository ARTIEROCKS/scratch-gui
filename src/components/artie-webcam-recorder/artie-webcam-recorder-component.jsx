import PropTypes from 'prop-types';
import {useEffect, useRef, useState, forwardRef, useImperativeHandle} from 'react';

const ArtieWebcamRecorderComponent = forwardRef(({
    userName,
    password,
    student,
    sensorObjectType,
    sensorName,
    send
}, ref) => {
    const mediaRecorderRef = useRef(null);
    const [fromDate, setFromDate] = useState(null);

    const startRecording = () => {
        if (mediaRecorderRef.current) { // Check if webcam is ready
            setFromDate(new Date()); // Initial fromDate for the first segment
            mediaRecorderRef.current.start();
        } else {
            console.warn('Webcam is not ready. Please wait...');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    useImperativeHandle(ref, () => ({
        startRecording,
        stopRecording
    }));

    useEffect(() => {
        const handleDataAvailable = event => {
            if (event.data.size > 0) {
                const toDate = new Date();
                const jsonBlob = new Blob([JSON.stringify(event.data)], {type: 'application/json'});

                send({
                    userName,
                    password,
                    student,
                    sensorObjectType,
                    sensorName,
                    data: jsonBlob,
                    fromDate,
                    toDate
                });

                // Update fromDate to prepare for the next segment
                setFromDate(new Date());
            }
        };

        const initWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true});
                mediaRecorderRef.current = new MediaRecorder(stream, {mimeType: 'video/webm'});
                mediaRecorderRef.current.ondataavailable = handleDataAvailable;

                // Añadir un retraso antes de llamar a startRecording
                setTimeout(() => {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
                        startRecording();
                    }
                }, 1000); // Espera de 1 segundo
            } catch (error) {
                console.error('Error accessing webcam:', error);
            }
        };

        initWebcam();
    }, [userName, password, student, sensorObjectType, sensorName, send]);

    useEffect(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const interval = setInterval(() => {
                mediaRecorderRef.current.requestData();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [fromDate]);
    
    ArtieWebcamRecorderComponent.displayName = 'ArtieWebcamRecorderComponent';
    return null; // No JSX returned since it's a functional, invisible component
});

ArtieWebcamRecorderComponent.propTypes = {
    userName: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    student: PropTypes.object.isRequired,
    sensorObjectType: PropTypes.string.isRequired,
    sensorName: PropTypes.string.isRequired,
    send: PropTypes.func.isRequired
};

export default ArtieWebcamRecorderComponent;
