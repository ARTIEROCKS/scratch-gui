/* eslint-disable no-unused-vars */
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import VM from 'artie-scratch-vm';

import {connect} from 'react-redux';

import {updateTargets} from '../reducers/targets';
import {updateBlockDrag} from '../reducers/block-drag';
import {updateMonitors} from '../reducers/monitors';
import {setProjectChanged, setProjectUnchanged} from '../reducers/project-changed';
import {setRunningState, setTurboState, setStartedState} from '../reducers/vm-status';
import {showExtensionAlert} from '../reducers/alerts';
import {updateMicIndicator} from '../reducers/mic-indicator';
import {artieBlocksUpdated, artieHelpReceived, artieResetSecondsHelpOpen} from '../reducers/artie-exercises';
import {artieShowHelpPopup} from '../reducers/artie-help';
import {artieChangeFlowState, ARTIE_FLOW_HELP_POPUP_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE
} from '../reducers/artie-flow';
import {sendBlockArtie} from '../lib/artie-api';

/*
 * Higher Order Component to manage events emitted by the VM
 * @param {React.Component} WrappedComponent component to manage VM events for
 * @returns {React.Component} connected component with vm events bound to redux
 */
const vmListenerHOC = function (WrappedComponent) {
    class VMListener extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleKeyDown',
                'handleKeyUp',
                'handleProjectChanged',
                'handleTargetsUpdate',
                'handleBlockArtieUpdate',
                'handleProjectRunStart',
                'handleGreenFlag'
            ]);
            // We have to start listening to the vm here rather than in
            // componentDidMount because the HOC mounts the wrapped component,
            // so the HOC componentDidMount triggers after the wrapped component
            // mounts.
            // If the wrapped component uses the vm in componentDidMount, then
            // we need to start listening before mounting the wrapped component.
            this.props.vm.on('targetsUpdate', this.handleTargetsUpdate);
            this.props.vm.on('MONITORS_UPDATE', this.props.onMonitorsUpdate);
            this.props.vm.on('BLOCK_DRAG_UPDATE', this.handleBlockArtieUpdate);
            this.props.vm.on('BLOCK_DRAG_UPDATE', this.props.onBlockDragUpdate);
            this.props.vm.on('TURBO_MODE_ON', this.props.onTurboModeOn);
            this.props.vm.on('TURBO_MODE_OFF', this.props.onTurboModeOff);
            this.props.vm.on('PROJECT_RUN_START', this.handleProjectRunStart);
            this.props.vm.on('PROJECT_RUN_STOP', this.props.onProjectRunStop);
            this.props.vm.on('PROJECT_CHANGED', this.handleProjectChanged);
            this.props.vm.on('RUNTIME_STARTED', this.props.onRuntimeStarted);
            this.props.vm.on('PROJECT_START', this.handleGreenFlag);
            this.props.vm.on('PERIPHERAL_CONNECTION_LOST_ERROR', this.props.onShowExtensionAlert);
            this.props.vm.on('MIC_LISTENING', this.props.onMicListeningUpdate);

        }
        componentDidMount () {
            if (this.props.attachKeyboardEvents) {
                document.addEventListener('keydown', this.handleKeyDown);
                document.addEventListener('keyup', this.handleKeyUp);
            }
            this.props.vm.postIOData('userData', {username: this.props.username});
        }
        componentDidUpdate (prevProps) {
            if (prevProps.username !== this.props.username) {
                this.props.vm.postIOData('userData', {username: this.props.username});
            }

            // Re-request a targets update when the shouldUpdateTargets state changes to true
            // i.e. when the editor transitions out of fullscreen/player only modes
            if (this.props.shouldUpdateTargets && !prevProps.shouldUpdateTargets) {
                this.props.vm.emitTargetsUpdate(false /* Emit the event, but do not trigger project change */);
            }
        }
        componentWillUnmount () {
            this.props.vm.removeListener('PERIPHERAL_CONNECTION_LOST_ERROR', this.props.onShowExtensionAlert);
            if (this.props.attachKeyboardEvents) {
                document.removeEventListener('keydown', this.handleKeyDown);
                document.removeEventListener('keyup', this.handleKeyUp);
            }
        }
        handleProjectChanged () {
            if (this.props.shouldUpdateProjectChanged && !this.props.projectChanged) {
                this.props.onProjectChanged();
            }
        }
        handleTargetsUpdate (data) {
            if (this.props.shouldUpdateTargets) {
                this.props.onTargetsUpdate(data);
            }
        }
        handleKeyDown (e) {
            // Don't capture keys intended for Blockly inputs.
            if (e.target !== document && e.target !== document.body) return;

            const key = (!e.key || e.key === 'Dead') ? e.keyCode : e.key;
            this.props.vm.postIOData('keyboard', {
                key: key,
                isDown: true
            });

            // Prevent space/arrow key from scrolling the page.
            if (e.keyCode === 32 || // 32=space
                (e.keyCode >= 37 && e.keyCode <= 40)) { // 37, 38, 39, 40 are arrows
                e.preventDefault();
            }
        }
        handleKeyUp (e) {
            // Always capture up events,
            // even those that have switched to other targets.
            const key = (!e.key || e.key === 'Dead') ? e.keyCode : e.key;
            this.props.vm.postIOData('keyboard', {
                key: key,
                isDown: false
            });

            // E.g., prevent scroll.
            if (e.target !== document && e.target !== document.body) {
                e.preventDefault();
            }
        }
        handleBlockArtieUpdate (areBlocksOverGui) {
            if (this.props.artieLogin.currentStudent !== null && this.props.artieExercises.currentExercise !== null){
                setTimeout(() => {
                    this.props.onArtieBlocksUpdated(this.props.vm.editingTarget.blocks._blocks);
                    sendBlockArtie(this.props.artieLogin.currentStudent, this.props.sprites,
                        this.props.artieExercises.currentExercise, false, this.props.artieHelp.emotionalState,
                        this.props.artieExercises.secondsHelpOpen, false, this.props.artieLogin.lastLogin,
                        this.props.artieExercises.lastExerciseChange,null, null)
                        .then(responseBodyObject => {
                            if (responseBodyObject !== null && responseBodyObject.predictedNeedHelp !== null){
                                this.props.onArtieShowHelpPopup(responseBodyObject.id,
                                    responseBodyObject.predictedNeedHelp);
                                this.props.onArtieChangeFlowState(ARTIE_FLOW_HELP_POPUP_STATE);
                            }
                        });

                    if (this.props.artieExercises.secondsHelpOpen > 0) {
                        this.props.onArtieResetSecondsHelpOpen();
                    }
                }, 500);
            }
        }
        handleProjectRunStart (){
            if (this.props.artieLogin.currentStudent !== null && this.props.artieExercises.currentExercise !== null){
                setTimeout(() => {
                    this.props.onArtieBlocksUpdated(this.props.vm.editingTarget.blocks._blocks);
                    sendBlockArtie(this.props.artieLogin.currentStudent, this.props.sprites,
                        this.props.artieExercises.currentExercise,false, this.props.artieHelp.emotionalState,
                        this.props.artieExercises.secondsHelpOpen, false, this.props.artieLogin.lastLogin,
                        this.props.artieExercises.lastExerciseChange,null, null)
                        .then(responseBodyObject => {
                            if ((responseBodyObject !== null && responseBodyObject.solutionDistance !== null &&
                                responseBodyObject.needHelp) ||
                                (responseBodyObject.solutionDistance !== null &&
                                    responseBodyObject.solutionDistance.totalDistance === 0 &&
                                    !responseBodyObject.predictedNeedHelp)){

                                // We show the help received
                                this.props.onArtieHelpReceived(responseBodyObject.solutionDistance);

                                if (responseBodyObject.solutionDistance.totalDistance === 0){
                                    this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
                                }

                            } else if (responseBodyObject !== null && responseBodyObject.predictedNeedHelp){
                                // We show the help popup
                                this.props.onArtieShowHelpPopup(responseBodyObject.id,
                                    responseBodyObject.predictedNeedHelp);
                                this.props.onArtieChangeFlowState(ARTIE_FLOW_HELP_POPUP_STATE);
                            }
                        });
                    if (this.props.artieExercises.secondsHelpOpen > 0) {
                        this.props.onArtieResetSecondsHelpOpen();
                    }
                }, 500);
            }
            this.props.onProjectRunStart();
        }
        handleGreenFlag (){
            if (this.props.artieLogin.currentStudent !== null && this.props.artieExercises.currentExercise !== null){
                setTimeout(() => {
                    this.props.onArtieBlocksUpdated(this.props.vm.editingTarget.blocks._blocks);
                    sendBlockArtie(this.props.artieLogin.currentStudent, this.props.sprites,
                        this.props.artieExercises.currentExercise, false, this.props.artieHelp.emotionalState,
                        this.props.artieExercises.secondsHelpOpen, false, this.props.artieLogin.lastLogin,
                        this.props.artieExercises.lastExerciseChange, null, null)
                        .then(responseBodyObject => {
                            if ((responseBodyObject !== null && responseBodyObject.solutionDistance !== null &&
                                    responseBodyObject.needHelp) ||
                                (responseBodyObject.solutionDistance !== null &&
                                    responseBodyObject.solutionDistance.totalDistance === 0 &&
                                    !responseBodyObject.predictedNeedHelp)){

                                // We show the help received
                                this.props.onArtieHelpReceived(responseBodyObject.solutionDistance);

                            } else if (responseBodyObject !== null && responseBodyObject.predictedNeedHelp){
                                // We show the help popup
                                this.props.onArtieShowHelpPopup(responseBodyObject.id,
                                    responseBodyObject.predictedNeedHelp);
                                this.props.onArtieChangeFlowState(ARTIE_FLOW_HELP_POPUP_STATE);
                            }
                        });
                    if (this.props.artieExercises.secondsHelpOpen > 0) {
                        this.props.onArtieResetSecondsHelpOpen();
                    }
                }, 500);
            }
            this.props.onGreenFlag();
        }

        render () {
            const {
                /* eslint-disable no-unused-vars */
                attachKeyboardEvents,
                projectChanged,
                shouldUpdateTargets,
                shouldUpdateProjectChanged,
                onBlockDragUpdate,
                onGreenFlag,
                onKeyDown,
                onKeyUp,
                onMicListeningUpdate,
                onMonitorsUpdate,
                onTargetsUpdate,
                onProjectChanged,
                onProjectRunStart,
                onProjectRunStop,
                onProjectSaved,
                onRuntimeStarted,
                onTurboModeOff,
                onTurboModeOn,
                onShowExtensionAlert,

                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return <WrappedComponent {...props} />;
        }
    }
    VMListener.propTypes = {
        attachKeyboardEvents: PropTypes.bool,
        onBlockDragUpdate: PropTypes.func.isRequired,
        onGreenFlag: PropTypes.func,
        onKeyDown: PropTypes.func,
        onKeyUp: PropTypes.func,
        onMicListeningUpdate: PropTypes.func.isRequired,
        onMonitorsUpdate: PropTypes.func.isRequired,
        onProjectChanged: PropTypes.func.isRequired,
        onProjectRunStart: PropTypes.func.isRequired,
        onProjectRunStop: PropTypes.func.isRequired,
        onProjectSaved: PropTypes.func.isRequired,
        onRuntimeStarted: PropTypes.func.isRequired,
        onShowExtensionAlert: PropTypes.func.isRequired,
        onTargetsUpdate: PropTypes.func.isRequired,
        onTurboModeOff: PropTypes.func.isRequired,
        onTurboModeOn: PropTypes.func.isRequired,
        projectChanged: PropTypes.bool,
        shouldUpdateTargets: PropTypes.bool,
        shouldUpdateProjectChanged: PropTypes.bool,
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired,
        projectTitle: PropTypes.string,
        onArtieBlocksUpdated: PropTypes.func,
        onArtieHelpReceived: PropTypes.func,
        onArtieResetSecondsHelpOpen: PropTypes.func,
        onArtieShowHelpPopup: PropTypes.func,
        onArtieChangeFlowState: PropTypes.func
    };
    VMListener.defaultProps = {
        attachKeyboardEvents: true,
        onGreenFlag: () => ({})
    };
    const mapStateToProps = state => ({
        projectChanged: state.scratchGui.projectChanged,
        // Do not emit target or project updates in fullscreen or player only mode
        // or when recording sounds (it leads to garbled recordings on low-power machines)
        shouldUpdateTargets: !state.scratchGui.mode.isFullScreen && !state.scratchGui.mode.isPlayerOnly &&
            !state.scratchGui.modals.soundRecorder,
        // Do not update the projectChanged state in fullscreen or player only mode
        shouldUpdateProjectChanged: !state.scratchGui.mode.isFullScreen && !state.scratchGui.mode.isPlayerOnly,
        vm: state.scratchGui.vm,
        username: state.session && state.session.session && state.session.session.user ?
            state.session.session.user.username : '',
        projectTitle: state.scratchGui.projectTitle,
        artieLogin: state.scratchGui.artieLogin,
        artieExercises: state.scratchGui.artieExercises,
        artieHelp: state.scratchGui.artieHelp,
        sprites: state.scratchGui.targets.sprites
    });
    const mapDispatchToProps = dispatch => ({
        onTargetsUpdate: data => {
            dispatch(updateTargets(data.targetList, data.editingTarget));
        },
        onMonitorsUpdate: monitorList => {
            dispatch(updateMonitors(monitorList));
        },
        onBlockDragUpdate: (blocks, areBlocksOverGui) => {
            dispatch(updateBlockDrag(areBlocksOverGui));
        },
        onArtieBlocksUpdated: blocks => {
            dispatch(artieBlocksUpdated(blocks));
        },
        onArtieHelpReceived: help => {
            dispatch(artieHelpReceived(help, new Date()));
        },
        onArtieResetSecondsHelpOpen: () => {
            dispatch(artieResetSecondsHelpOpen());
        },
        onArtieShowHelpPopup: (id, showHelpPopup) => dispatch(artieShowHelpPopup(id, showHelpPopup)),
        onArtieChangeFlowState: state => dispatch(artieChangeFlowState(state)),
        onProjectRunStart: () => dispatch(setRunningState(true)),
        onProjectRunStop: () => dispatch(setRunningState(false)),
        onProjectChanged: () => dispatch(setProjectChanged()),
        onProjectSaved: () => dispatch(setProjectUnchanged()),
        onRuntimeStarted: () => dispatch(setStartedState(true)),
        onTurboModeOn: () => dispatch(setTurboState(true)),
        onTurboModeOff: () => dispatch(setTurboState(false)),
        onShowExtensionAlert: data => {
            dispatch(showExtensionAlert(data));
        },
        onMicListeningUpdate: listening => {
            dispatch(updateMicIndicator(listening));
        }
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(VMListener);
};

export default vmListenerHOC;
