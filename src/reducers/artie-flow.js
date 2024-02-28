const ARTIE_FLOW_LOGIN_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_LOGIN_STATE';
const ARTIE_FLOW_STUDENT_DATA_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_STUDENT_DATA_STATE';
const ARTIE_FLOW_EXERCISES_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_EXERCISES_STATE';
const ARTIE_FLOW_EXERCISE_STATEMENT_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_EXERCISE_STATEMENT_STATE';
const ARTIE_FLOW_WORKSPACE_STATE = 'scratch-gui/artie-flow/ARTIE_FLOW_WORKSPACE_STATE';


const initialState = {
    flowState: ARTIE_FLOW_LOGIN_STATE
};

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
    default:
        return state;
    }
};

const artieFlowLoginState = () => ({
    type: ARTIE_FLOW_LOGIN_STATE
});

const artieFlowStudentDataState = () => ({
    type: ARTIE_FLOW_STUDENT_DATA_STATE
});

const artieFlowExercisesState = () => ({
    type: ARTIE_FLOW_EXERCISES_STATE
});

const artieFlowExerciseStatementState = () => ({
    type: ARTIE_FLOW_EXERCISE_STATEMENT_STATE
});

const artieFlowWorkspaceState = () => ({
    type: ARTIE_FLOW_WORKSPACE_STATE
});

export {
    reducer as default,
    initialState as artieFlowInitialState,
    artieFlowLoginState,
    artieFlowStudentDataState,
    artieFlowExercisesState,
    artieFlowExerciseStatementState,
    artieFlowWorkspaceState,
    ARTIE_FLOW_LOGIN_STATE,
    ARTIE_FLOW_STUDENT_DATA_STATE,
    ARTIE_FLOW_EXERCISES_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE,
    ARTIE_FLOW_WORKSPACE_STATE
};
