import {createRef, useEffect, useRef, useState} from 'react';
import regeneratorRuntime from 'regenerator-runtime';

const ArtieWebcamRecorderComponent = props => {

    const streamRef = useRef();
    const streamRecorderRef = useRef();
    const [isRecording, setIsRecording] = useState(false);
    const [audioSource, setAudioSource] = useState('');
    const [videoSource, setVideoSource] = useState('');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const chunks = useRef();
    const [error, setError] = useState(null);

    const dateOptions = {year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        timeZoneName: 'short'};

    const startRecording = () => {
        if (isRecording) {
            return;
        }
        if (!streamRef.current){
            return;
        }
        streamRecorderRef.current = new MediaRecorder(streamRef.current);
        streamRecorderRef.current.start();
        setToDate(null);
        setFromDate(new Date().toLocaleDateString('es-ES', dateOptions));
        streamRecorderRef.current.ondataavailable = function (event){
            if (chunks.current.length > 0) {
                chunks.current.push(event.data);
            } else {
                chunks.current = [event.data];
            }
        };
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (!streamRecorderRef.current){
            return;
        }
        streamRecorderRef.current.stop();
        setToDate(new Date().toLocaleDateString('es-ES', dateOptions));
        setIsRecording(false);
    };

    /**
     * Use Effect for getting the states from the local storage and sets in the component
     */
    useEffect(() => {

        setIsRecording(window.localStorage.getItem('webcamRecorder_isRecording') === 'true');
        setAudioSource(window.localStorage.getItem('webcamRecorder_audioSource'));
        setVideoSource(window.localStorage.getItem('webcamRecorder_videoSource'));
        setFromDate(window.localStorage.getItem('webcamRecorder_fromDate'));
        setFromDate(window.localStorage.getItem('webcamRecorder_toDate'));
        setError(window.localStorage.getItem('webcamRecorder_error'));

    }, []);

    /**
     * Use Effect for setting the states to the local storage
     */
    useEffect(() => {
        window.localStorage.setItem('webcamRecorder_isRecording', isRecording);
        window.localStorage.setItem('webcamRecorder_props_recording', props.artieWebcam.recording);
        window.localStorage.setItem('webcamRecorder_audioSource', audioSource);
        window.localStorage.setItem('webcamRecorder_videoSource', videoSource);
        window.localStorage.setItem('webcamRecorder_fromDate', fromDate);
        window.localStorage.setItem('webcamRecorder_toDate', toDate);
        window.localStorage.setItem('webcamRecorder_error', error);
    }, [isRecording, audioSource, videoSource, fromDate, toDate, error]);

    useEffect(() => {
        if (isRecording) {
            return;
        }
        if (chunks !== undefined && chunks.current !== undefined && chunks.current.length === 0){
            return;
        }
        const blob = new Blob(chunks.current, {
            type: 'video/x-matroska;codecs=avc1'
        });

        const reader = new FileReader();
        reader.onload = function () {
            const jsonBlob = reader.result;

            // Sends all the information to the API
            // eslint-disable-next-line max-len
            props.send(props.userName, props.password, props.student, props.sensorObjectType, props.sensorName, jsonBlob,
                fromDate, toDate);

            chunks.current = [];
        };
        reader.readAsDataURL(blob);

    }, [isRecording]);

    // Effect to stop and then to start again the video and audio recording
    useEffect(() => {

        // Creates the interval function to send the video every x seconds
        const interval = setInterval(() => {

            // eslint-disable-next-line max-len
            const isRecordingLocal = (window.localStorage.getItem('webcamRecorder_isRecording') === 'true');
            const propsRecording = (window.localStorage.getItem('webcamRecorder_props_recording') === 'true');

            if (isRecordingLocal && propsRecording) {
                stopRecording();
            } else if (propsRecording) {
                startRecording();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (props.artieWebcam.recording) {
            startRecording();
        } else {
            stopRecording();
        }
    }, [props.artieWebcam.recording]);

    useEffect(() => {
        async function prepareStream () {

            async function gotStream (stream) {
                if (streamRef !== undefined) {
                    streamRef.current = stream;
                }
            }

            function gotDevices (deviceInfos){
                const _audioSourceOptions = [];
                const _videoSourceOptions = [];

                for (const device of deviceInfos){
                    if (device.kind === 'audioinput'){
                        _audioSourceOptions.push(device.deviceId);
                    } else if (device.kind === 'videoinput') {
                        _videoSourceOptions.push(device.deviceId);
                    }
                }

                // We take the first options for audio and video
                if (_audioSourceOptions.length > 0) {
                    setAudioSource(_audioSourceOptions[0]);
                }
                if (_videoSourceOptions.length > 0) {
                    setVideoSource(_videoSourceOptions[0]);
                }
            }

            async function getStream () {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => {
                        track.stop();
                    });
                }

                const constraints = {
                    audio: {deviceId: audioSource === '' ? undefined : {exact: audioSource}},
                    video: {deviceId: videoSource === '' ? undefined : {exact: videoSource}}
                };

                try {
                    const stream = await navigator.mediaDevices.getUserMedia(constraints);
                    await gotStream(stream);
                } catch (err) {
                    setError(err);
                }

            }
            const getDevices = () => navigator.mediaDevices.enumerateDevices();

            const mediaDevices = await getDevices();
            await getStream();
            gotDevices(mediaDevices);
        }
        prepareStream();
    }, []);

    return null;
};

export default ArtieWebcamRecorderComponent;
