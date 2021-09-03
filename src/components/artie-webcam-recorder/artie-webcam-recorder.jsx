import {useEffect, useRef, useState} from 'react';

const ArtieWebcamRecorder = () => {

    const videoRef = useRef<null | HTMLVideoElement>(null);
    const streamRef = useRef<null | MediaStream>(null);
    const streamRecorderRef = useRef<null | MediaRecorder>(null);
    const [downloadLink, setDownloadLink] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [audioSource, setAudioSource] = useState<string>('');
    const [videoSource, setVideoSource] = useState<string>('');
    const [audioSourceOptions, setAudioSourceOptions] = useState<Record<string, string>[]>([]);
    const [videoSourceOptions, setVideoSourceOptions] = useState<Record<string, string>[]>([]);
    const chunks = useRef<any[]>([]);
    const [error, setError] = useState<null | Error>(null);

    const startRecording = () => {
        if (isRecording) {
            return;
        }
        if (!streamRef.current){
            return;
        }
        streamRecorderRef.current = new MediaRecorder(streamRef.current);
        streamRecorderRef.current.start();
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
        setDownloadLink(URL.createObjectURL(blob));
        chunks.current = [];
    }, [isRecording]);

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
                        _audioSourceOptions.push({
                            value: device.deviceId,
                            label: device.label || `Microphone ${device.deviceId}`
                        });
                    } else if (device === 'videoinput') {
                        _videoSourceOptions.push({
                            value: device.deviceId,
                            label: device.label || `Camera ${device.deviceId}`
                        });
                    }
                }

                setAudioSourceOptions(_audioSourceOptions);
                setVideoSourceOptions(_videoSourceOptions);
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
                    gotStream(stream);
                } catch (error) {
                    setError(error);
                }

            }
            await getStream();
            const mediaDevices = await getDevices();
            gotDevices(mediaDevices);

        };
        prepareStream();
    }, []);

    return (
        <div>
            <div>
                <select id="videoSource" name="videoSource" value={videoSource}>
                    {videoSourceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <select id="audioSource" name="audioSource" value={audioSource}>
                    {audioSourceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <video ref={videoRef} autoPlay muted playsInline />
            </div>
            <div>
                {downloadLink && <video src={downloadLink} controls></video>}
                {downloadLink && (<a href={downloadLink} download="file.mp4">Descargar</a>)}
            </div>
            <div>
                <button onClick={startRecording} disabled={isRecording}>Grabar</button>
                <button onClick={stopRecording} disabled={!isRecording}>Parar</button>
            </div>
            <div>
                {error && <p>{error.message}</p>}
            </div>
        </div>
    );
};

export default ArtieWebcamRecorder;
