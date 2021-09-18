const ARTIE_WEBCAM_RECORDING = 'scratch-gui/artie-webcam/ARTIE_WEBCAM_RECORDING';

const initialState = {
    recording: false
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case ARTIE_WEBCAM_RECORDING:
        return Object.assign({}, state, {
            recording: action.recording
        });
    default:
        return state;
    }
};

const changeArtieWebcamRecording = recording => ({
    type: ARTIE_WEBCAM_RECORDING,
    recording: recording
});


export {
    reducer as default,
    initialState as artieWebcamInitialState,
    changeArtieWebcamRecording
};
