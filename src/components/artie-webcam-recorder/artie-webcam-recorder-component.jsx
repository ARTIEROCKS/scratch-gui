import {useEffect, useRef, useState} from 'react';
import {sendSensorInformation} from "../../lib/artie-api";

const ArtieWebcamRecorderComponent = (userName, password, student, sensorObjectType, sensorName, callback) => {

    const videoRef = useRef<null | HTMLVideoElement>(null);
    const streamRef = useRef<null | MediaStream>(null);
    const streamRecorderRef = useRef<null | MediaRecorder>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioSource, setAudioSource] = useState<string>('');
    const [videoSource, setVideoSource] = useState<string>('');
    const [fromDate, setFromDate] = useState<Date>(null);
    const [toDate, setToDate] = useState<Date>(null);
    const chunks = useRef<any[]>([]);
    const [error, setError] = useState<null | Error>(null);

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
        streamRecorderRef.current.ondataavailable = function (event: BlobEvent){
            if (chunks.current) {
                chunks.current.push(event.data);
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

    useEffect(() => {
        if (isRecording) {
            return;
        }
        if (chunks.current.length === 0){
            return;
        }
        const blob = new Blob(chunks.current, {
            type: 'video/x-matroska;codecs=avc1,opus'
        });

        // Sends all the information to the API
        callback(userName, password, student, sensorObjectType, sensorName, blob, fromDate, toDate);

        chunks.current = [];
    }, [isRecording]);

    // Effect to stop and then to start again the video and audio recording
    useEffect(() => {
        // Creates the interval function to send the video every x seconds
        const interval = setInterval(() => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function prepareStream () {

            async function gotStream (stream: MediaStream) {
                streamRef.current = stream;
                if (videoRef.current){
                    videoRef.current.srcObject = stream;
                }
            }

            function gotDevices (deviceInfos: MediaDeviceInfo[]){
                const _audioSourceOptions = [];
                const _videoSourceOptions = [];

                for (const device of deviceInfos){
                    if (device.kind === 'audioinput'){
                        _audioSourceOptions.push(device.deviceId);
                    } else if (device === 'videoinput') {
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

            const getDevices = () => navigator.mediaDevices.enumerateDevices();

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
            await getStream();
            const mediaDevices = await getDevices();
            gotDevices(mediaDevices);
        }
        prepareStream();
    }, []);

    return null;
};

export default ArtieWebcamRecorderComponent;
