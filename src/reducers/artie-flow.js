const ARTIE_LOGIN_STATE = 'scratch-gui/artie-flow/ARTIE_LOGIN_STATE';
const ARTIE_STUDENT_DATA_STATE = 'scratch-gui/artie-flow/ARTIE_STUDENT_DATA_STATE';
const ARTIE_EXERCISES_STATE = 'scratch-gui/artie-flow/ARTIE_EXERCISES_STATE';
const ARTIE_EXERCISE_STATEMENT_STATE = 'scratch-gui/artie-flow/ARTIE_EXERCISE_STATEMENT_STATE';


const initialState = {
    flowState: ARTIE_LOGIN_STATE
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {

    case ARTIE_LOGIN_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_STUDENT_DATA_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_EXERCISES_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    case ARTIE_EXERCISE_STATEMENT_STATE:
        return Object.assign({}, state, {
            flowState: action.type
        });
    default:
        return state;
    }
};

const artieLoginState = () => ({
    type: ARTIE_LOGIN_STATE
});

const artieStudentDataState = () => ({
    type: ARTIE_STUDENT_DATA_STATE
});

const artieExercisesState = () => ({
    type: ARTIE_EXERCISES_STATE
});

const artieExerciseStatementState = () => ({
    type: ARTIE_EXERCISE_STATEMENT_STATE
});

export {
    reducer as default,
    initialState as artieFlowInitialState,
    artieLoginState,
    artieStudentDataState,
    artieExercisesState,
    artieExerciseStatementState,
    ARTIE_LOGIN_STATE,
    ARTIE_STUDENT_DATA_STATE,
    ARTIE_EXERCISES_STATE,
    ARTIE_EXERCISE_STATEMENT_STATE
};
