const ARTIE_FLOW_LOGIN_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_LOGIN_STATE';
const ARTIE_FLOW_STUDENT_DATA_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_STUDENT_DATA_STATE';
const ARTIE_FLOW_EXERCISES_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_EXERCISES_STATE';
const ARTIE_FLOW_EXERCISE_STATEMENT_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_EXERCISE_STATEMENT_STATE';
const ARTIE_FLOW_WORKSPACE_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_WORKSPACE_STATE';
const ARTIE_FLOW_EMOTIONAL_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_EMOTIONAL_STATE';
const ARTIE_FLOW_HELP_POPUP_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_HELP_POPUP_STATE';


const initialState = {
    flowState: ARTIE_FLOW_LOGIN_STATE
};

// Generic action creator to change the flow state
const setArtieFlowState = type => ({type});

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {

    case ARTIE_FLOW_LOGIN_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_FLOW_STUDENT_DATA_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_FLOW_EXERCISES_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_FLOW_EXERCISE_STATEMENT_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_FLOW_WORKSPACE_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_FLOW_EMOTIONAL_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_FLOW_HELP_POPUP_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    default:
        return state;
    }
};

export {
    reducer as default,
    initialState as artieFlowInitialState,
    ARTIE_FLOW_LOGIN_STATE,
    ARTIE_FLOW_STUDENT_DATA_STATE,
    ARTIE_FLOW_EXERCISES_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE,
    ARTIE_FLOW_WORKSPACE_STATE,
    ARTIE_FLOW_EMOTIONAL_STATE,
    ARTIE_FLOW_HELP_POPUP_STATE,
    setArtieFlowState
};
