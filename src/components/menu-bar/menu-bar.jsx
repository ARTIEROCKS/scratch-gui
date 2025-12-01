import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import bowser from 'bowser';
import React from 'react';

import VM from 'artie-scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import CommunityButton from './community-button.jsx';
import ShareButton from './share-button.jsx';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import Divider from '../divider/divider.jsx';
import SaveStatus from './save-status.jsx';
import ProjectWatcher from '../../containers/project-watcher.jsx';
import MenuBarMenu from './menu-bar-menu.jsx';
import {MenuItem, MenuSection} from '../menu/menu.jsx';
import ProjectTitleInput from './project-title-input.jsx';
import AuthorInfo from './author-info.jsx';
import AccountNav from '../../containers/account-nav.jsx';
import LoginDropdown from './login-dropdown.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import DeletionRestorer from '../../containers/deletion-restorer.jsx';
import TurboMode from '../../containers/turbo-mode.jsx';
import MenuBarHOC from '../../containers/menu-bar-hoc.jsx';
import SettingsMenu from './settings-menu.jsx';
import SelectExerciseButton from './select-exercise-button.jsx';
import RequestHelpButton from './request-help-button.jsx';
import StatementButton from './statement-button.jsx';

import {openTipsLibrary} from '../../reducers/modals';
import {setPlayer} from '../../reducers/mode';
import {
    isTimeTravel220022BC,
    isTimeTravel1920,
    isTimeTravel1990,
    isTimeTravel2020,
    isTimeTravelNow,
    setTimeTravel
} from '../../reducers/time-travel';
import {
    autoUpdateProject,
    getIsUpdating,
    getIsShowingProject,
    manualUpdateProject,
    requestNewProject,
    remixProject,
    saveProjectAsCopy
} from '../../reducers/project-state';
import {
    openAboutMenu,
    closeAboutMenu,
    aboutMenuOpen,
    openAccountMenu,
    closeAccountMenu,
    accountMenuOpen,
    openFileMenu,
    closeFileMenu,
    fileMenuOpen,
    openEditMenu,
    closeEditMenu,
    editMenuOpen,
    openLoginMenu,
    closeLoginMenu,
    loginMenuOpen,
    openModeMenu,
    closeModeMenu,
    modeMenuOpen,
    settingsMenuOpen,
    openSettingsMenu,
    closeSettingsMenu,
    openArtieMenu,
    closeArtieMenu,
    artieMenuOpen
} from '../../reducers/menus';

import collectMetadata from '../../lib/collect-metadata';

import styles from './menu-bar.css';

import helpIcon from '../../lib/assets/icon--tutorials.svg';
import mystuffIcon from './icon--mystuff.png';
import profileIcon from './icon--profile.png';
import remixIcon from './icon--remix.svg';
import dropdownCaret from './dropdown-caret.svg';
import aboutIcon from './icon--about.svg';
import fileIcon from './icon--file.svg';
import editIcon from './icon--edit.svg';

import scratchLogo from './scratch-logo.svg';
import ninetiesLogo from './nineties_logo.svg';
import catLogo from './cat_logo.svg';
import prehistoricLogo from './prehistoric-logo.svg';
import oldtimeyLogo from './oldtimey-logo.svg';

import sharedMessages from '../../lib/shared-messages';

import {sendSolutionArtie, sendBlockArtie} from '../../lib/artie-api';
import {activateArtieLogin, artieLogout} from '../../reducers/artie-login';
import {
    activateArtieExercises,
    artieClearExercises,
    artieHelpReceived,
    artieLoadingSolution,
    artieLoadingExercise,
    artieLoadingHelp,
    artiePopupExercise,
    artieEvaluationStop,
    artiePopupStatement,
    artieResetSecondsHelpOpen
} from '../../reducers/artie-exercises';
import {artieShowHelpPopup} from '../../reducers/artie-help';
import {
    ARTIE_FLOW_LOGIN_STATE,
    ARTIE_FLOW_EXERCISES_STATE,
    ARTIE_FLOW_EXERCISE_STATEMENT_STATE,
    ARTIE_FLOW_EMOTIONAL_STATE,
    ARTIE_FLOW_HELP_POPUP_STATE,
    setArtieFlowState
} from '../../reducers/artie-flow.js';
import ArtieFlow from '../../containers/artie-flow.jsx';
import ArtieWebcamRecorder from '../../containers/artie-webcam-recorder.jsx';
import {ArtieExerciseStatementTooltip} from '../artie-exercises/artie-exercises-statement.jsx';

import html2canvas from 'html2canvas';
import Spinner from '../spinner/spinner.jsx';
import ArtieLoadingOverlay from '../artie-help/artie-loading-overlay.jsx';

const ariaMessages = defineMessages({
    tutorials: {
        id: 'gui.menuBar.tutorialsLibrary',
        defaultMessage: 'Tutorials',
        description: 'accessibility text for the tutorials button'
    }
});

const MenuBarItemTooltip = ({
    children,
    className,
    enable,
    id,
    place = 'bottom'
}) => {
    if (enable) {
        return (
            <React.Fragment>
                {children}
            </React.Fragment>
        );
    }
    return (
        <ComingSoonTooltip
            className={classNames(styles.comingSoon, className)}
            place={place}
            tooltipClassName={styles.comingSoonTooltip}
            tooltipId={id}
        >
            {children}
        </ComingSoonTooltip>
    );
};


MenuBarItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    enable: PropTypes.bool,
    id: PropTypes.string,
    place: PropTypes.oneOf(['top', 'bottom', 'left', 'right'])
};

const MenuItemTooltip = ({id, isRtl, children, className}) => (
    <ComingSoonTooltip
        className={classNames(styles.comingSoon, className)}
        isRtl={isRtl}
        place={isRtl ? 'left' : 'right'}
        tooltipClassName={styles.comingSoonTooltip}
        tooltipId={id}
    >
        {children}
    </ComingSoonTooltip>
);

MenuItemTooltip.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    id: PropTypes.string,
    isRtl: PropTypes.bool
};

const AboutButton = props => (
    <Button
        className={classNames(styles.menuBarItem, styles.hoverable)}
        iconClassName={styles.aboutIcon}
        iconSrc={aboutIcon}
        onClick={props.onClick}
    />
);

AboutButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

// eslint-disable-next-line no-unused-vars
let exerciseId = null;


class MenuBar extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClickNew',
            'handleClickRemix',
            'handleClickSave',
            'handleClickSaveAsCopy',
            'handleClickSeeCommunity',
            'handleClickShare',
            'handleSetMode',
            'handleKeyPress',
            'handleRestoreOption',
            'getSaveToComputerHandler',
            'restoreOptionMessage',
            'handleClickRegisterSolution',
            'handleArtieLogout',
            'handleActivateArtieExerciseSelector',
            'handleArtieExerciseChange',
            'handleClickFinishExercise',
            'handleStopEvaluation',
            'handleShowPopupStatement',
            'handleClickRequestEmotionalHelp',
            'handleArtieFeatureFlagLoaded'
        ]);

        // Setting the default SPLIT IO Flags values
        this.artieEmotionalPopupFeature = '';
        this.artieHelpPopupFeature = '';
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyPress);
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyPress);
    }
    handleClickNew () {
        // if the project is dirty, and user owns the project, we will autosave.
        // but if they are not logged in and can't save, user should consider
        // downloading or logging in first.
        // Note that if user is logged in and editing someone else's project,
        // they'll lose their work.
        const readyToReplaceProject = this.props.confirmReadyToReplaceProject(
            this.props.intl.formatMessage(sharedMessages.replaceProjectWarning)
        );
        this.props.onRequestCloseFile();
        if (readyToReplaceProject) {
            this.props.onClickNew(this.props.canSave && this.props.canCreateNew);
        }
        this.props.onRequestCloseFile();
    }
    handleClickRemix () {
        this.props.onClickRemix();
        this.props.onRequestCloseFile();
    }
    handleClickSave () {
        this.props.onClickSave();
        this.props.onRequestCloseFile();
    }
    handleClickSaveAsCopy () {
        this.props.onClickSaveAsCopy();
        this.props.onRequestCloseFile();
    }
    handleClickSeeCommunity (waitForUpdate) {
        if (this.props.shouldSaveBeforeTransition()) {
            this.props.autoUpdateProject(); // save before transitioning to project page
            waitForUpdate(true); // queue the transition to project page
        } else {
            waitForUpdate(false); // immediately transition to project page
        }
    }
    handleClickShare (waitForUpdate) {
        if (!this.props.isShared) {
            if (this.props.canShare) { // save before transitioning to project page
                this.props.onShare();
            }
            if (this.props.canSave) { // save before transitioning to project page
                this.props.autoUpdateProject();
                waitForUpdate(true); // queue the transition to project page
            } else {
                waitForUpdate(false); // immediately transition to project page
            }
        }
    }
    handleSetMode (mode) {
        return () => {
            // Turn on/off filters for modes.
            if (mode === '1920') {
                document.documentElement.style.filter = 'brightness(.9)contrast(.8)sepia(1.0)';
                document.documentElement.style.height = '100%';
            } else if (mode === '1990') {
                document.documentElement.style.filter = 'hue-rotate(40deg)';
                document.documentElement.style.height = '100%';
            } else {
                document.documentElement.style.filter = '';
                document.documentElement.style.height = '';
            }

            // Change logo for modes
            if (mode === '1990') {
                document.getElementById('logo_img').src = ninetiesLogo;
            } else if (mode === '2020') {
                document.getElementById('logo_img').src = catLogo;
            } else if (mode === '1920') {
                document.getElementById('logo_img').src = oldtimeyLogo;
            } else if (mode === '220022BC') {
                document.getElementById('logo_img').src = prehistoricLogo;
            } else {
                document.getElementById('logo_img').src = this.props.logo;
            }

            this.props.onSetTimeTravelMode(mode);
        };
    }
    handleRestoreOption (restoreFun) {
        return () => {
            restoreFun();
            this.props.onRequestCloseEdit();
        };
    }
    handleKeyPress (event) {
        const modifier = bowser.mac ? event.metaKey : event.ctrlKey;
        if (modifier && event.key === 's') {
            this.props.onClickSave();
            event.preventDefault();
        }
    }
    getSaveToComputerHandler (downloadProjectCallback) {
        return () => {
            this.props.onRequestCloseFile();
            downloadProjectCallback();
            if (this.props.onProjectTelemetryEvent) {
                const metadata = collectMetadata(this.props.vm, this.props.projectTitle, this.props.locale);
                this.props.onProjectTelemetryEvent('projectDidSave', metadata);
            }
        };
    }
    restoreOptionMessage (deletedItem) {
        switch (deletedItem) {
        case 'Sprite':
            return (<FormattedMessage
                defaultMessage="Restore Sprite"
                description="Menu bar item for restoring the last deleted sprite."
                id="gui.menuBar.restoreSprite"
            />);
        case 'Sound':
            return (<FormattedMessage
                defaultMessage="Restore Sound"
                description="Menu bar item for restoring the last deleted sound."
                id="gui.menuBar.restoreSound"
            />);
        case 'Costume':
            return (<FormattedMessage
                defaultMessage="Restore Costume"
                description="Menu bar item for restoring the last deleted costume."
                id="gui.menuBar.restoreCostume"
            />);
        default: {
            return (<FormattedMessage
                defaultMessage="Restore"
                description="Menu bar item for restoring the last deleted item in its disabled state." /* eslint-disable-line max-len */
                id="gui.menuBar.restore"
            />);
        }
        }
    }
    buildAboutMenu (onClickAbout) {
        if (!onClickAbout) {
            // hide the button
            return null;
        }
        if (typeof onClickAbout === 'function') {
            // make a button which calls a function
            return <AboutButton onClick={onClickAbout} />;
        }
        // assume it's an array of objects
        // each item must have a 'title' FormattedMessage and a 'handleClick' function
        // generate a menu with items for each object in the array
        return (
            <div
                className={classNames(styles.menuBarItem, styles.hoverable, {
                    [styles.active]: this.props.aboutMenuOpen
                })}
                onMouseUp={this.props.onRequestOpenAbout}
            >
                <img
                    className={styles.aboutIcon}
                    src={aboutIcon}
                    alt="About"
                />
                <MenuBarMenu
                    className={classNames(styles.menuBarMenu)}
                    open={this.props.aboutMenuOpen}
                    place={this.props.isRtl ? 'right' : 'left'}
                    onRequestClose={this.props.onRequestCloseAbout}
                >
                    {
                        onClickAbout.map(itemProps => (
                            <MenuItem
                                key={itemProps.title}
                                isRtl={this.props.isRtl}
                                onClick={this.wrapAboutMenuCallback(itemProps.onClick)}
                            >
                                {itemProps.title}
                            </MenuItem>
                        ))
                    }
                </MenuBarMenu>
            </div>
        );
    }
    handleClickRegisterSolution (){
        this.props.onArtieLoadingSolution(true, false);
        const body = document.querySelector('body');

        // Getting the blob
        this.props.saveProjectSb3().then(content => {

            let binary = '';
            let canvasUrl = '';
            const reader = new FileReader();
            const userId = this.props.artieLogin.user.id;
            const sprites = this.props.sprites;
            const currentExercise = this.props.artieExercises.currentExercise;
            const fOnArtieLoadingSolution = this.props.onArtieLoadingSolution;
            const fOnArtieExerciseSentPopupOpen = this.props.onArtieExerciseSentPopupOpen;

            reader.readAsDataURL(content);
            reader.onloadend = function () {
                binary = reader.result;
                html2canvas(body).then(canvas => {
                    canvasUrl = canvas.toDataURL('image/png');
                    sendSolutionArtie(userId, sprites, currentExercise, canvasUrl, binary)
                        .then(() => {
                            fOnArtieLoadingSolution(false, true);
                            fOnArtieExerciseSentPopupOpen(true);
                        });
                });
            };
        });
    }
    wrapAboutMenuCallback (callback) {
        return () => {
            callback();
            this.props.onRequestCloseAbout();
        };
    }
    handleClickFinishExercise (){
        this.props.onArtieLoadingExercise(true, false);
        const body = document.querySelector('body');

        // Getting the blob
        this.props.saveProjectSb3().then(content => {

            let binary = '';
            let canvasUrl = '';
            const reader = new FileReader();
            const currentStudent = this.props.artieLogin.currentStudent;
            const sprites = this.props.sprites;
            const currentExercise = this.props.artieExercises.currentExercise;
            const secondsHelpOpen = this.props.artieExercises.secondsHelpOpen;
            const lastLogin = this.props.artieLogin.lastLogin;
            const lastExerciseChange = this.props.artieExercises.lastExerciseChange;
            const fOnArtieLoadingExercise = this.props.onArtieLoadingExercise;
            const fOnArtieExerciseSentPopupOpen = this.props.onArtieExerciseSentPopupOpen;
            const fOnArtieResetSecondsHelpOpen = this.props.onArtieResetSecondsHelpOpen;
            const emotionalState = this.props.artieHelp.emotionalState;

            reader.readAsDataURL(content);
            reader.onloadend = function () {
                binary = reader.result;
                html2canvas(body)
                    .then(canvas => {
                        canvasUrl = canvas.toDataURL('image/png');
                        return sendBlockArtie(
                            currentStudent,
                            sprites,
                            currentExercise,
                            false,
                            emotionalState,
                            secondsHelpOpen,
                            true,
                            lastLogin,
                            lastExerciseChange,
                            canvasUrl,
                            binary
                        );
                    })
                    .then(() => {
                        // Éxito: mostramos popup y cambiamos de estado
                        fOnArtieExerciseSentPopupOpen(true);
                    })
                    .catch(() => {
                        // En caso de error, simplemente cerramos el overlay en finally
                    })
                    .finally(() => {
                        // Siempre detener la pantalla de carga y resetear contador si corresponde
                        fOnArtieLoadingExercise(false);
                        if (secondsHelpOpen > 0) {
                            fOnArtieResetSecondsHelpOpen();
                        }
                    });
            };
        })
            .catch(() => {
                // Si falla la obtención del blob, aseguramos ocultar el overlay
                this.props.onArtieLoadingExercise(false);
            });
    }
    handleArtieLogout (){
        this.props.onArtieLogout();
        this.props.onArtieClearExercises();
        this.props.onArtieChangeFlowState(ARTIE_FLOW_LOGIN_STATE);
    }
    handleArtieExerciseChange (e){
        exerciseId = e.target.value;
    }
    handleActivateArtieExerciseSelector (){
        this.props.onActivateArtieExercises();
        this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISES_STATE);
    }
    handleStopEvaluation (){
        this.props.onArtieEvaluationStop(true);
        this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
    }
    handleShowPopupStatement (){
        this.props.onArtiePopupStatement(true);
        this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
    }
    handleClickRequestEmotionalHelp (){
        // Avoid multiple requests while help loading is in progress
        if (this.props.artieExercises.loadingHelp) return;

        this.props.onArtieShowHelpPopup(null, true);

        if (this.artieEmotionalPopupFeature === 'on') {
            // Show the emotional popup only when the feature flag is active
            this.props.onArtieChangeFlowState(ARTIE_FLOW_EMOTIONAL_STATE);
        } else {
            // Turn on loading overlay while waiting for the help response
            this.props.onArtieLoadingHelp(true);

            // Compute Split guard: if Help_Popup is OFF and the student interacts with the robot,
            // we should NOT present the help popup; the robot tutor will provide the help instead.
            const interactsWithRobot = Boolean(
                // eslint-disable-next-line max-len
                (this.props.artieLogin && this.props.artieLogin.currentStudent && this.props.artieLogin.currentStudent.interactsWithRobot) ||
                (this.props.artieLogin && this.props.artieLogin.user && this.props.artieLogin.user.interactsWithRobot)
            );
            const hideByFeature = this.artieHelpPopupFeature === 'off' && interactsWithRobot;

            // Wrap the help request so we can enforce a client-side timeout
            const HELP_TIMEOUT_MS = 15000; // 15 seconds to avoid an infinite loading overlay

            const helpRequestPromise = sendBlockArtie(
                this.props.artieLogin.currentStudent,
                this.props.sprites,
                this.props.artieExercises.currentExercise,
                true,
                this.props.artieHelp.emotionalState,
                this.props.artieExercises.secondsHelpOpen,
                false,
                this.props.artieLogin.lastLogin,
                this.props.artieExercises.lastExerciseChange,
                null,
                null
            );

            const timeoutPromise = new Promise((resolve, reject) => {
                this.artieHelpTimeoutId = setTimeout(() => {
                    // Mark this as a timeout-specific error so we can handle it if needed
                    const timeoutError = new Error('ARTIE_HELP_TIMEOUT');
                    timeoutError.code = 'ARTIE_HELP_TIMEOUT';
                    reject(timeoutError);
                }, HELP_TIMEOUT_MS);
            });

            Promise.race([helpRequestPromise, timeoutPromise])
                .then(responseBodyObject => {
                    // If we got a real response, clear the timeout timer
                    if (this.artieHelpTimeoutId) {
                        clearTimeout(this.artieHelpTimeoutId);
                        this.artieHelpTimeoutId = null;
                    }

                    // If the response has a solution distance object
                    if (responseBodyObject !== null && responseBodyObject.solutionDistance !== null){
                        this.props.onArtieHelpReceived(responseBodyObject.solutionDistance);
                        if (responseBodyObject.solutionDistance.totalDistance === 0){
                            this.props.onArtieChangeFlowState(ARTIE_FLOW_EXERCISE_STATEMENT_STATE);
                        } else if (!hideByFeature) {
                            this.props.onArtieChangeFlowState(ARTIE_FLOW_HELP_POPUP_STATE);
                        }
                    }
                })
                .catch(() => {
                    // If the error is a timeout or a network/server error, just ensure the overlay closes.
                    if (this.artieHelpTimeoutId) {
                        clearTimeout(this.artieHelpTimeoutId);
                        this.artieHelpTimeoutId = null;
                    }

                    // TODO: Optionally dispatch a user-visible error for ARTIE help timeout
                })
                .finally(() => {
                    // Stop the loading help overlay in all paths (success, error or timeout)
                    this.props.onArtieLoadingHelp(false);
                });

            if (this.props.artieExercises.secondsHelpOpen > 0) {
                this.props.onArtieResetSecondsHelpOpen();
            }
        }
    }
    handleArtieFeatureFlagLoaded (featureFlag, value){
        if (featureFlag === 'Emotional_Popup') {
            this.artieEmotionalPopupFeature = value;
        }
        if (featureFlag === 'Help_Popup'){
            this.artieHelpPopupFeature = value;
        }
    }
    render () {
        const saveNowMessage = (
            <FormattedMessage
                defaultMessage="Save now"
                description="Menu bar item for saving now"
                id="gui.menuBar.saveNow"
            />
        );
        const createCopyMessage = (
            <FormattedMessage
                defaultMessage="Save as a copy"
                description="Menu bar item for saving as a copy"
                id="gui.menuBar.saveAsCopy"
            />
        );
        const remixMessage = (
            <FormattedMessage
                defaultMessage="Remix"
                description="Menu bar item for remixing"
                id="gui.menuBar.remix"
            />
        );
        const newProjectMessage = (
            <FormattedMessage
                defaultMessage="New"
                description="Menu bar item for creating a new project"
                id="gui.menuBar.new"
            />
        );
        const remixButton = (
            <Button
                className={classNames(
                    styles.menuBarButton,
                    styles.remixButton
                )}
                iconClassName={styles.remixButtonIcon}
                iconSrc={remixIcon}
                onClick={this.handleClickRemix}
            >
                {remixMessage}
            </Button>
        );
        // Compute small helpers to keep JSX lines short and readable
        const user = this.props.artieLogin && this.props.artieLogin.user;
        const isLoggedIn = Boolean(user);
        const isStudent = isLoggedIn && user.role === 0;
        const isTeacher = isLoggedIn && user.role === 1;
        const hasCurrentStudent = Boolean(this.props.artieLogin && this.props.artieLogin.currentStudent);
        const hasExercise = Boolean(this.props.artieExercises && this.props.artieExercises.currentExercise);
        const isEvaluation = hasExercise && this.props.artieExercises.currentExercise.evaluation;
        const showLogin = !isLoggedIn || (isStudent && !hasCurrentStudent);
        // Show the About button only if we have a handler for it (like in the desktop app)
        const aboutButton = this.buildAboutMenu(this.props.onClickAbout);
        return (
            <Box
                className={classNames(
                    this.props.className,
                    styles.menuBar
                )}
            >
                <div className={styles.mainMenu}>
                    <div className={styles.fileGroup}>
                        <div className={classNames(styles.menuBarItem)}>
                            <img
                                id="logo_img"
                                alt="Scratch"
                                className={classNames(styles.scratchLogo, {
                                    [styles.clickable]: typeof this.props.onClickLogo !== 'undefined'
                                })}
                                draggable={false}
                                src={this.props.logo}
                                onClick={this.props.onClickLogo}
                            />
                        </div>
                        {(this.props.canChangeTheme || this.props.canChangeLanguage) && (<SettingsMenu
                            canChangeLanguage={this.props.canChangeLanguage}
                            canChangeTheme={this.props.canChangeTheme}
                            isRtl={this.props.isRtl}
                            onRequestClose={this.props.onRequestCloseSettings}
                            onRequestOpen={this.props.onClickSettings}
                            settingsMenuOpen={this.props.settingsMenuOpen}
                        />)}
                        {(this.props.canManageFiles) && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable, {
                                    [styles.active]: this.props.fileMenuOpen
                                })}
                                onMouseUp={this.props.onClickFile}
                            >
                                <img src={fileIcon} alt="File" />
                                <span className={styles.collapsibleLabel}>
                                    <FormattedMessage
                                        defaultMessage="File"
                                        description="Text for file dropdown menu"
                                        id="gui.menuBar.file"
                                    />
                                </span>
                                <img src={dropdownCaret} alt="Open" />
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.fileMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                    onRequestClose={this.props.onRequestCloseFile}
                                >
                                    <MenuSection>
                                        <MenuItem
                                            isRtl={this.props.isRtl}
                                            onClick={this.handleClickNew}
                                        >
                                            {newProjectMessage}
                                        </MenuItem>
                                    </MenuSection>
                                    {(this.props.canSave || this.props.canCreateCopy || this.props.canRemix) && (
                                        <MenuSection>
                                            {this.props.canSave && (
                                                <MenuItem onClick={this.handleClickSave}>
                                                    {saveNowMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canCreateCopy && (
                                                <MenuItem onClick={this.handleClickSaveAsCopy}>
                                                    {createCopyMessage}
                                                </MenuItem>
                                            )}
                                            {this.props.canRemix && (
                                                <MenuItem onClick={this.handleClickRemix}>
                                                    {remixMessage}
                                                </MenuItem>
                                            )}
                                        </MenuSection>
                                    )}
                                    <MenuSection>
                                        <MenuItem
                                            onClick={this.props.onStartSelectingFileUpload}
                                        >
                                            {this.props.intl.formatMessage(sharedMessages.loadFromComputerTitle)}
                                        </MenuItem>
                                        <SB3Downloader>{(className, downloadProjectCallback) => (
                                            <MenuItem
                                                className={className}
                                                onClick={this.getSaveToComputerHandler(downloadProjectCallback)}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Save to your computer"
                                                    description="Menu bar item for downloading a project to your computer" // eslint-disable-line max-len
                                                    id="gui.menuBar.downloadToComputer"
                                                />
                                            </MenuItem>
                                        )}</SB3Downloader>
                                    </MenuSection>
                                </MenuBarMenu>
                            </div>
                        )}
                        <div
                            className={classNames(styles.menuBarItem, styles.hoverable, {
                                [styles.active]: this.props.editMenuOpen
                            })}
                            onMouseUp={this.props.onClickEdit}
                        >
                            <img src={editIcon} alt="Edit" />
                            <span className={styles.collapsibleLabel}>
                                <FormattedMessage
                                    defaultMessage="Edit"
                                    description="Text for edit dropdown menu"
                                    id="gui.menuBar.edit"
                                />
                            </span>
                            <img src={dropdownCaret} alt="Open" />
                            <MenuBarMenu
                                className={classNames(styles.menuBarMenu)}
                                open={this.props.editMenuOpen}
                                place={this.props.isRtl ? 'left' : 'right'}
                                onRequestClose={this.props.onRequestCloseEdit}
                            >
                                <DeletionRestorer>{(handleRestore, {restorable, deletedItem}) => (
                                    <MenuItem
                                        className={classNames({[styles.disabled]: !restorable})}
                                        onClick={this.handleRestoreOption(handleRestore)}
                                    >
                                        {this.restoreOptionMessage(deletedItem)}
                                    </MenuItem>
                                )}</DeletionRestorer>
                                <MenuSection>
                                    <TurboMode>{(toggleTurboMode, {turboMode}) => (
                                        <MenuItem onClick={toggleTurboMode}>
                                            {turboMode ? (
                                                <FormattedMessage
                                                    defaultMessage="Turn off Turbo Mode"
                                                    description="Menu bar item for turning off turbo mode"
                                                    id="gui.menuBar.turboModeOff"
                                                />
                                            ) : (
                                                <FormattedMessage
                                                    defaultMessage="Turn on Turbo Mode"
                                                    description="Menu bar item for turning on turbo mode"
                                                    id="gui.menuBar.turboModeOn"
                                                />
                                            )}
                                        </MenuItem>
                                    )}</TurboMode>
                                </MenuSection>
                            </MenuBarMenu>

                        </div>
                        {this.props.isTotallyNormal && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable, {
                                    [styles.active]: this.props.modeMenuOpen
                                })}
                                onMouseUp={this.props.onClickMode}
                            >
                                <div className={classNames(styles.editMenu)}>
                                    <FormattedMessage
                                        defaultMessage="Mode"
                                        description="Mode menu item in the menu bar"
                                        id="gui.menuBar.modeMenu"
                                    />
                                </div>
                                <MenuBarMenu
                                    className={classNames(styles.menuBarMenu)}
                                    open={this.props.modeMenuOpen}
                                    place={this.props.isRtl ? 'left' : 'right'}
                                    onRequestClose={this.props.onRequestCloseMode}
                                >
                                    <MenuSection>
                                        <MenuItem onClick={this.handleSetMode('NOW')}>
                                            <span className={classNames({[styles.inactive]: !this.props.modeNow})}>
                                                {'✓'}
                                            </span>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage="Normal mode"
                                                description="April fools: resets editor to not have any pranks"
                                                id="gui.menuBar.normalMode"
                                            />
                                        </MenuItem>
                                        <MenuItem onClick={this.handleSetMode('2020')}>
                                            <span className={classNames({[styles.inactive]: !this.props.mode2020})}>
                                                {'✓'}
                                            </span>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage="Caturday mode"
                                                description="April fools: Cat blocks mode"
                                                id="gui.menuBar.caturdayMode"
                                            />
                                        </MenuItem>
                                    </MenuSection>
                                </MenuBarMenu>
                            </div>
                        )}
                    </div>
                    {this.props.canEditTitle ? (
                        <div className={classNames(styles.menuBarItem, styles.growable)}>
                            <MenuBarItemTooltip
                                enable
                                id="title-field"
                            >
                                <ProjectTitleInput
                                    className={classNames(styles.titleFieldGrowable)}
                                />
                            </MenuBarItemTooltip>
                        </div>
                    ) : ((this.props.authorUsername && this.props.authorUsername !== this.props.username) ? (
                        <AuthorInfo
                            className={styles.authorInfo}
                            imageUrl={this.props.authorThumbnailUrl}
                            projectTitle={this.props.projectTitle}
                            userId={this.props.authorId}
                            username={this.props.authorUsername}
                        />
                    ) : null)}
                    <div className={classNames(styles.menuBarItem)}>
                        {this.props.canShare && (this.props.isShowingProject || this.props.isUpdating) ? (
                            <ProjectWatcher onDoneUpdating={this.props.onSeeCommunity}>
                                {(waitForUpdate) => (
                                    <ShareButton
                                        className={styles.menuBarButton}
                                        isShared={this.props.isShared}
                                        /* eslint-disable react/jsx-no-bind */
                                        onClick={() => {
                                            this.handleClickShare(waitForUpdate);
                                        }}
                                        /* eslint-enable react/jsx-no-bind */
                                    />
                                )}
                            </ProjectWatcher>
                        ) : (!this.props.canShare && this.props.showComingSoon ? (
                            <MenuBarItemTooltip id="share-button">
                                <ShareButton className={styles.menuBarButton} />
                            </MenuBarItemTooltip>
                        ) : null)}
                        {this.props.canRemix ? remixButton : null}
                    </div>
                    <div className={classNames(styles.menuBarItem, styles.communityButtonWrapper)}>
                        {this.props.enableCommunity && (this.props.isShowingProject || this.props.isUpdating) ? (
                            <ProjectWatcher onDoneUpdating={this.props.onSeeCommunity}>
                                {(waitForUpdate) => (
                                    <CommunityButton
                                        className={styles.menuBarButton}
                                        /* eslint-disable react/jsx-no-bind */
                                        onClick={() => {
                                            this.handleClickSeeCommunity(waitForUpdate);
                                        }}
                                        /* eslint-enable react/jsx-no-bind */
                                    />
                                )}
                            </ProjectWatcher>
                        ) : (this.props.showComingSoon ? (
                            <MenuBarItemTooltip id="community-button">
                                <CommunityButton className={styles.menuBarButton} />
                            </MenuBarItemTooltip>
                        ) : null)}
                    </div>
                    <Divider className={classNames(styles.divider)} />
                    <div className={styles.fileGroup}>
                        <div
                            className={classNames(styles.menuBarItem, styles.hoverable, {
                                [styles.active]: this.props.artieMenuOpen
                            })}
                            onMouseUp={this.props.onClickArtie}
                        >
                            <div className={classNames(styles.editMenu)}>
                                <FormattedMessage
                                    defaultMessage="ARTIE"
                                    description="Text for artie dropdown menu"
                                    id="gui.menuBar.artie"
                                />
                            </div>
                            <MenuBarMenu
                                className={classNames(styles.menuBarMenu)}
                                open={this.props.artieMenuOpen}
                                place={this.props.isRtl ? 'left' : 'right'}
                                onRequestClose={this.props.onRequestCloseArtie}
                            >
                                <MenuSection>
                                    {showLogin ? (
                                        <MenuItem onClick={this.props.onActivateArtieLogin}>
                                            <FormattedMessage
                                                defaultMessage="Login"
                                                description="Menu bar item for login"
                                                id="gui.menuBar.artie.login"
                                            />
                                        </MenuItem>
                                    ) : (
                                        <MenuItem onClick={this.handleArtieLogout}>
                                            <FormattedMessage
                                                defaultMessage="Logout"
                                                description="Menu bar item for logout"
                                                id="gui.menuBar.artie.logout"
                                            />
                                        </MenuItem>
                                    )}
                                </MenuSection>
                                {isTeacher && hasExercise ? (
                                    <MenuSection>
                                        <MenuItem onClick={this.handleClickRegisterSolution}>
                                            <FormattedMessage
                                                defaultMessage="Register solution"
                                                description="Menu bar item for registering a solution"
                                                id="gui.menuBar.artie.registerSolution"
                                            />
                                            {this.props.artieExercises.loadingSolution ? (
                                                <Spinner
                                                    small
                                                    className={styles.spinner}
                                                    level={'info'}
                                                />
                                            ) : null}
                                        </MenuItem>
                                    </MenuSection>
                                ) : null}
                                {isStudent && hasCurrentStudent && hasExercise && !isEvaluation ? (
                                    <MenuSection>
                                        <MenuItem
                                            onClick={this.props.artieExercises.loadingHelp ? null : this.handleClickRequestEmotionalHelp}
                                            className={classNames({
                                                [styles.disabled]: this.props.artieExercises.loadingHelp
                                            })}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Request help"
                                                description="Menu bar item for requesting help"
                                                id="gui.menuBar.artie.requestHelp"
                                            />
                                            {this.props.artieExercises.loadingHelp ? (
                                                <Spinner
                                                    small
                                                    className={styles.spinner}
                                                    level={'info'}
                                                />
                                            ) : null }
                                        </MenuItem>
                                    </MenuSection>
                                ) : null}
                                {isStudent && hasCurrentStudent && hasExercise && !isEvaluation ? (
                                    <MenuSection>
                                        <MenuItem onClick={this.handleClickFinishExercise}>
                                            <FormattedMessage
                                                defaultMessage="Finish exercise"
                                                description="Menu bar item for finish the exercise"
                                                id="gui.menuBar.artie.finishExercise"
                                            />
                                            {this.props.artieExercises.loadingExercise ? (
                                                <Spinner
                                                    small
                                                    className={styles.spinner}
                                                    level={'info'}
                                                />
                                            ) : null}
                                        </MenuItem>
                                    </MenuSection>
                                ) : null}
                            </MenuBarMenu>
                        </div>

                        {isLoggedIn && ((isStudent && hasCurrentStudent) || isTeacher) ?
                            <React.Fragment>
                                <Divider className={classNames(styles.divider)} />
                                <div
                                    className={classNames(styles.menuBarItem)}
                                >
                                    <div className={classNames(styles.editMenu)}>

                                        {hasExercise ? (
                                            <React.Fragment>
                                                <ArtieExerciseStatementTooltip
                                                    enable
                                                    tooltipId="artie-exercise"
                                                    place="bottom"
                                                    className={classNames(styles.artieFlowExercisesStatement)}
                                                    tooltipClassName={styles.artieFlowExercisesStatementTooltip}
                                                    message={this.props.artieExercises.currentExercise.description}
                                                >
                                                    <FormattedMessage
                                                        defaultMessage="Exercise: "
                                                        description="Exercise label"
                                                        id="gui.menuBar.artie.exercise"
                                                    /><label>{this.props.artieExercises.currentExercise.name}</label>
                                                </ArtieExerciseStatementTooltip>
                                            </React.Fragment>
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="No exercise selected"
                                                description="Exercise label"
                                                id="gui.menuBar.artie.noExercise"
                                            />
                                        )}
                                    </div>
                                </div>

                                { isStudent && hasExercise && isEvaluation ? (
                                    <SelectExerciseButton
                                        className={styles.menuBarButton}
                                        onClick={this.handleStopEvaluation}
                                        isExerciseSelected
                                        evaluation={this.props.artieExercises.currentExercise.evaluation}
                                    />
                                ) : null }

                                { isStudent && hasExercise && !isEvaluation ? (
                                    <React.Fragment>
                                        <Divider className={classNames(styles.divider)} />
                                        <RequestHelpButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleClickRequestEmotionalHelp}
                                            disabled={this.props.artieExercises.loadingHelp}
                                        />
                                    </React.Fragment>
                                ) : null }

                                { isStudent && hasExercise && isEvaluation ? (
                                    <React.Fragment>
                                        <Divider className={classNames(styles.divider)} />
                                        <StatementButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleShowPopupStatement}
                                        />
                                    </React.Fragment>
                                ) : (
                                    <React.Fragment>
                                        <Divider className={classNames(styles.divider)} />
                                        <SelectExerciseButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleActivateArtieExerciseSelector}
                                            isExerciseSelected={hasExercise}
                                            evaluation={false}
                                        />
                                        <Divider className={classNames(styles.divider)} />
                                        <StatementButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleShowPopupStatement}
                                        />
                                    </React.Fragment>
                                )}
                            </React.Fragment> :
                            null
                        }
                    </div>

                    <Divider className={classNames(styles.divider)} />
                    <div className={styles.fileGroup}>
                        <div
                            aria-label={this.props.intl.formatMessage(ariaMessages.tutorials)}
                            className={classNames(styles.menuBarItem, styles.hoverable)}
                            onClick={this.props.onOpenTipLibrary}
                        >
                            <img
                                className={styles.helpIcon}
                                src={helpIcon}
                                alt="Help"
                            />
                            <span className={styles.tutorialsLabel}>
                                <FormattedMessage {...ariaMessages.tutorials} />
                            </span>
                        </div>
                    </div>
                </div>

                {/* show the proper UI in the account menu, given whether the user is
                logged in, and whether a session is available to log in with */}
                <div className={styles.accountInfoGroup}>
                    <div className={styles.menuBarItem}>
                        {this.props.canSave && (
                            <SaveStatus />
                        )}
                    </div>
                    {this.props.sessionExists ? (
                        this.props.username ? (
                            // ************ user is logged in ************
                            <React.Fragment>
                                <a href="/mystuff/">
                                    <div
                                        className={classNames(
                                            styles.menuBarItem,
                                            styles.hoverable,
                                            styles.mystuffButton
                                        )}
                                    >
                                        <img
                                            className={styles.mystuffIcon}
                                            src={mystuffIcon}
                                            alt="My Stuff"
                                        />
                                    </div>
                                </a>
                                <AccountNav
                                    className={classNames(
                                        styles.menuBarItem,
                                        styles.hoverable,
                                        {[styles.active]: this.props.accountMenuOpen}
                                    )}
                                    isOpen={this.props.accountMenuOpen}
                                    isRtl={this.props.isRtl}
                                    menuBarMenuClassName={classNames(styles.menuBarMenu)}
                                    onClick={this.props.onClickAccount}
                                    onClose={this.props.onRequestCloseAccount}
                                    onLogOut={this.props.onLogOut}
                                />
                            </React.Fragment>
                        ) : (
                            // ********* user not logged in, but a session exists
                            // ********* so they can choose to log in
                            <React.Fragment>
                                <div
                                    className={classNames(
                                        styles.menuBarItem,
                                        styles.hoverable
                                    )}
                                    key="join"
                                    onMouseUp={this.props.onOpenRegistration}
                                >
                                    <FormattedMessage
                                        defaultMessage="Join Scratch"
                                        description="Link for creating a Scratch account"
                                        id="gui.menuBar.joinScratch"
                                    />
                                </div>
                                <div
                                    className={classNames(
                                        styles.menuBarItem,
                                        styles.hoverable
                                    )}
                                    key="login"
                                    onMouseUp={this.props.onClickLogin}
                                >
                                    <FormattedMessage
                                        defaultMessage="Sign in"
                                        description="Link for signing in to your Scratch account"
                                        id="gui.menuBar.signIn"
                                    />
                                    <LoginDropdown
                                        className={classNames(styles.menuBarMenu)}
                                        isOpen={this.props.loginMenuOpen}
                                        isRtl={this.props.isRtl}
                                        renderLogin={this.props.renderLogin}
                                        onClose={this.props.onRequestCloseLogin}
                                    />
                                </div>
                            </React.Fragment>
                        )
                    ) : (
                        // ******** no login session is available, so don't show login stuff
                        <React.Fragment>
                            {this.props.showComingSoon ? (
                                <React.Fragment>
                                    <MenuBarItemTooltip id="mystuff">
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.mystuffButton
                                            )}
                                        >
                                            <img
                                                className={styles.mystuffIcon}
                                                src={mystuffIcon}
                                                alt="My Stuff"
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                    <MenuBarItemTooltip
                                        id="account-nav"
                                        place={this.props.isRtl ? 'right' : 'left'}
                                    >
                                        <div
                                            className={classNames(
                                                styles.menuBarItem,
                                                styles.hoverable,
                                                styles.accountNavMenu
                                            )}
                                        >
                                            <img
                                                className={styles.profileIcon}
                                                src={profileIcon}
                                                alt="Profile"
                                            />
                                            <span>
                                                {'scratch-cat'}
                                            </span>
                                            <img
                                                className={styles.dropdownCaretIcon}
                                                src={dropdownCaret}
                                                alt="Open"
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                </React.Fragment>
                            ) : null}
                        </React.Fragment>
                    )}
                </div>

                {aboutButton}

                {(
                    this.props.artieExercises.loadingHelp ||
                    this.props.artieExercises.loadingExercise
                ) ? (
                    <ArtieLoadingOverlay />
                ) : null}

                {/* Propagate Split flag down so ArtieFlow/ArtieHelp can decide visibility */}
                <ArtieFlow
                    onArtieFeatureFlagLoaded={this.handleArtieFeatureFlagLoaded}
                    artieHelpPopupFeature={this.artieHelpPopupFeature}
                />
                <ArtieWebcamRecorder />
            </Box>
        );
    }
}

MenuBar.propTypes = {
    aboutMenuOpen: PropTypes.bool,
    accountMenuOpen: PropTypes.bool,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    autoUpdateProject: PropTypes.func,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    className: PropTypes.string,
    confirmReadyToReplaceProject: PropTypes.func,
    currentLocale: PropTypes.string.isRequired,
    editMenuOpen: PropTypes.bool,
    artieMenuOpen: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    fileMenuOpen: PropTypes.bool,
    intl: intlShape,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    isUpdating: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    loginMenuOpen: PropTypes.bool,
    logo: PropTypes.string,
    mode1920: PropTypes.bool,
    mode1990: PropTypes.bool,
    mode2020: PropTypes.bool,
    mode220022BC: PropTypes.bool,
    modeMenuOpen: PropTypes.bool,
    modeNow: PropTypes.bool,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func, // button mode: call this callback when the About button is clicked
        PropTypes.arrayOf( // menu mode: list of items in the About menu
            PropTypes.shape({
                title: PropTypes.string, // text for the menu item
                onClick: PropTypes.func // call this callback when the menu item is clicked
            })
        )
    ]),
    onClickAccount: PropTypes.func,
    onClickEdit: PropTypes.func,
    onClickFile: PropTypes.func,
    onClickLogin: PropTypes.func,
    onClickLogo: PropTypes.func,
    onClickMode: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSave: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onClickSettings: PropTypes.func,
    // Added: validate handler used to open the Artie login menu item
    onActivateArtieLogin: PropTypes.func.isRequired,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onOpenTipLibrary: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestCloseAbout: PropTypes.func,
    onRequestCloseAccount: PropTypes.func,
    onRequestCloseEdit: PropTypes.func,
    onRequestCloseFile: PropTypes.func,
    onRequestCloseLogin: PropTypes.func,
    onRequestCloseMode: PropTypes.func,
    onRequestCloseSettings: PropTypes.func,
    onRequestOpenAbout: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onSetTimeTravelMode: PropTypes.func,
    onShare: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    projectTitle: PropTypes.string,
    renderLogin: PropTypes.func,
    sessionExists: PropTypes.bool,
    settingsMenuOpen: PropTypes.bool,
    shouldSaveBeforeTransition: PropTypes.func,
    showComingSoon: PropTypes.bool,
    username: PropTypes.string,
    userOwnsProject: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    onActivateArtieExercises: PropTypes.func.isRequired,
    onArtieShowHelpPopup: PropTypes.func.isRequired,
    onArtieChangeFlowState: PropTypes.func.isRequired,
    onArtieLogout: PropTypes.func.isRequired,
    onArtieClearExercises: PropTypes.func.isRequired,
    onArtieLoadingExercise: PropTypes.func.isRequired,
    onArtiePopupStatement: PropTypes.func.isRequired,
    onArtieEvaluationStop: PropTypes.func.isRequired,
    onArtieHelpReceived: PropTypes.func.isRequired,
    onArtieLoadingHelp: PropTypes.func.isRequired,
    onArtieResetSecondsHelpOpen: PropTypes.func.isRequired,
    // Añadidos para validación
    onArtieLoadingSolution: PropTypes.func.isRequired,
    onArtieExerciseSentPopupOpen: PropTypes.func.isRequired,
    saveProjectSb3: PropTypes.func.isRequired,
    onClickArtie: PropTypes.func.isRequired,
    onRequestCloseArtie: PropTypes.func.isRequired,
    artieLogin: PropTypes.object.isRequired,
    artieExercises: PropTypes.object.isRequired,
    artieHelp: PropTypes.object.isRequired,
    sprites: PropTypes.object.isRequired
};

MenuBar.defaultProps = {
    logo: scratchLogo,
    onShare: () => {}
};

const mapStateToProps = (state, ownProps) => {
    const loadingState = state.scratchGui.projectState.loadingState;
    const user = state.session && state.session.session && state.session.session.user;
    return {
        aboutMenuOpen: aboutMenuOpen(state),
        accountMenuOpen: accountMenuOpen(state),
        currentLocale: state.locales.locale,
        fileMenuOpen: fileMenuOpen(state),
        editMenuOpen: editMenuOpen(state),
        artieMenuOpen: artieMenuOpen(state),
        isRtl: state.locales.isRtl,
        isUpdating: getIsUpdating(loadingState),
        isShowingProject: getIsShowingProject(loadingState),
        locale: state.locales.locale,
        loginMenuOpen: loginMenuOpen(state),
        modeMenuOpen: modeMenuOpen(state),
        projectTitle: state.scratchGui.projectTitle,
        sessionExists: state.session && typeof state.session.session !== 'undefined',
        settingsMenuOpen: settingsMenuOpen(state),
        username: user ? user.username : null,
        userOwnsProject: ownProps.authorUsername && user &&
            (ownProps.authorUsername === user.username),
        vm: state.scratchGui.vm,
        mode220022BC: isTimeTravel220022BC(state),
        mode1920: isTimeTravel1920(state),
        mode1990: isTimeTravel1990(state),
        mode2020: isTimeTravel2020(state),
        modeNow: isTimeTravelNow(state),
        artieLogin: state.scratchGui.artieLogin,
        artieExercises: state.scratchGui.artieExercises,
        artieEmotionalStatus: state.scratchGui.artieEmotionalStatus,
        artieHelp: state.scratchGui.artieHelp,
        sprites: state.scratchGui.targets.sprites,
        saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm)
    };
};

const mapDispatchToProps = dispatch => ({
    autoUpdateProject: () => dispatch(autoUpdateProject()),
    onOpenTipLibrary: () => dispatch(openTipsLibrary()),
    onClickAccount: () => dispatch(openAccountMenu()),
    onRequestCloseAccount: () => dispatch(closeAccountMenu()),
    onClickFile: () => dispatch(openFileMenu()),
    onRequestCloseFile: () => dispatch(closeFileMenu()),
    onClickEdit: () => dispatch(openEditMenu()),
    onRequestCloseEdit: () => dispatch(closeEditMenu()),
    onClickLogin: () => dispatch(openLoginMenu()),
    onRequestCloseLogin: () => dispatch(closeLoginMenu()),
    onClickMode: () => dispatch(openModeMenu()),
    onRequestCloseMode: () => dispatch(closeModeMenu()),
    onRequestOpenAbout: () => dispatch(openAboutMenu()),
    onRequestCloseAbout: () => dispatch(closeAboutMenu()),
    onClickSettings: () => dispatch(openSettingsMenu()),
    onRequestCloseSettings: () => dispatch(closeSettingsMenu()),
    onClickNew: needSave => dispatch(requestNewProject(needSave)),
    onClickRemix: () => dispatch(remixProject()),
    onClickSave: () => dispatch(manualUpdateProject()),
    onClickSaveAsCopy: () => dispatch(saveProjectAsCopy()),
    onSeeCommunity: () => dispatch(setPlayer(true)),
    onSetTimeTravelMode: mode => dispatch(setTimeTravel(mode)),
    onActivateArtieLogin: () => dispatch(activateArtieLogin()),
    onArtieLogout: () => dispatch(artieLogout()),
    onArtieClearExercises: () => dispatch(artieClearExercises()),
    onArtieResetSecondsHelpOpen: () => dispatch(artieResetSecondsHelpOpen()),
    onActivateArtieExercises: () => dispatch(activateArtieExercises()),
    onArtieHelpReceived: help => dispatch(artieHelpReceived(help, new Date())),
    onArtieLoadingSolution: (loading, sent) => dispatch(artieLoadingSolution(loading, sent)),
    onArtieLoadingExercise: (loading, sent) => dispatch(artieLoadingExercise(loading, sent)),
    onArtieLoadingHelp: loading => dispatch(artieLoadingHelp(loading)),
    onArtieExerciseSentPopupOpen: active => dispatch(artiePopupExercise(active)),
    onArtieEvaluationStop: stop => dispatch(artieEvaluationStop(stop)),
    onArtiePopupStatement: active => dispatch(artiePopupStatement(active)),
    onArtieShowHelpPopup: (id, showHelpPopup) => dispatch(artieShowHelpPopup(id, showHelpPopup)),
    onClickArtie: () => dispatch(openArtieMenu()),
    onRequestCloseArtie: () => dispatch(closeArtieMenu()),
    onArtieChangeFlowState: state => dispatch(setArtieFlowState(state))
});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);
