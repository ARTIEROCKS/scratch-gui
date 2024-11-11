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
            const initialFromDate = new Date();
            setFromDate(initialFromDate); // Initial fromDate for the first segment
            mediaRecorderRef.current.fromDate = initialFromDate;
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
                const reader = new FileReader();

                reader.readAsDataURL(event.data);
                reader.onloadend = () => {
                    
                    const dataUrl = reader.result;
                    
                    send(
                        userName,
                        password,
                        student,
                        sensorObjectType,
                        sensorName,
                        dataUrl,
                        formatDate(mediaRecorderRef.current.fromDate),
                        formatDate(toDate)
                    );

                    // Update fromDate to prepare for the next segment
                    const newFromDate = new Date();
                    setFromDate(newFromDate);
                    mediaRecorderRef.current.fromDate = newFromDate;
                
                };
            }
        };

        const initWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true});
                const mimeType = 'video/webm; codecs=vp8';

                if (MediaRecorder.isTypeSupported(mimeType)) {
                    mediaRecorderRef.current = new MediaRecorder(stream, {mimeType});
                    
                } else {
                    console.warn(`MIME type ${mimeType} is not supported. Defaulting to MP4.`);
                    mediaRecorderRef.current = new MediaRecorder(stream, {mimeType: 'video/mp4; codecs=avc1'});
                }

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
