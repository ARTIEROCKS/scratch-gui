import classNames from 'classnames';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import bowser from 'bowser';
import React from 'react';

import VM from 'scratch-vm';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import CommunityButton from './community-button.jsx';
import ShareButton from './share-button.jsx';
import {ComingSoonTooltip} from '../coming-soon/coming-soon.jsx';
import Divider from '../divider/divider.jsx';
import LanguageSelector from '../../containers/language-selector.jsx';
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
import SelectExerciseButton from './select-exercise-button.jsx';
import RequestHelpButton from './request-help-button.jsx';
import StatementButton from './statement-button.jsx';

import {openTipsLibrary} from '../../reducers/modals';
import {setPlayer} from '../../reducers/mode';
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
    openLanguageMenu,
    closeLanguageMenu,
    languageMenuOpen,
    openLoginMenu,
    closeLoginMenu,
    loginMenuOpen,
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
import languageIcon from '../language-selector/language-icon.svg';
import aboutIcon from './icon--about.svg';

import scratchLogo from './scratch-logo.svg';

import sharedMessages from '../../lib/shared-messages';

import {sendSolutionArtie, sendBlockArtie} from '../../lib/artie-api';
import {activateArtieLogin, artieLogout} from '../../reducers/artie-login';
import {activateArtieExercises, artieClearExercises,
    artieHelpReceived, artieLoadingSolution, artieLoadingExercise, artieLoadingHelp,
    artiePopupExercise, artieEvaluationStop, artiePopupStatement, artieResetSecondsHelpOpen} from '../../reducers/artie-exercises';
import {artieShowHelpPopup} from '../../reducers/artie-help';
import ArtieFlow from '../../containers/artie-flow.jsx';
import ArtieWebcamRecorder from '../../containers/artie-webcam-recorder.jsx';
import {ArtieExerciseStatementTooltip} from '../artie-exercises/artie-exercises-statement.jsx';

import html2canvas from 'html2canvas';
import Spinner from '../spinner/spinner.jsx';

const ariaMessages = defineMessages({
    language: {
        id: 'gui.menuBar.LanguageSelector',
        defaultMessage: 'language selector',
        description: 'accessibility text for the language selection menu'
    },
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
            'handleKeyPress',
            'handleLanguageMouseUp',
            'handleRestoreOption',
            'getSaveToComputerHandler',
            'restoreOptionMessage',
            'handleClickRegisterSolution',
            'handleClickRequestHelp',
            'handleArtieLogout',
            'handleArtieExerciseChange',
            'handleClickFinishExercise',
            'handleStopEvaluation',
            'handleShowPopupStatement',
            'handleClickRequestEmotionalHelp'
        ]);
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
    handleLanguageMouseUp (e) {
        if (!this.props.languageMenuOpen) {
            this.props.onClickLanguage(e);
        }
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
    handleClickRequestHelp (){
        this.props.onArtieLoadingHelp(true);
        sendBlockArtie(this.props.artieLogin.currentStudent, this.props.sprites,
            this.props.artieExercises.currentExercise, true, null,
            this.props.artieExercises.secondsHelpOpen, false, this.props.artieLogin.lastLogin,
            this.props.artieExercises.lastExerciseChange, null, null)
            .then(responseBodyObject => {

                // Stops the loading help
                this.props.onArtieLoadingHelp(false);

                // If the response has a solution distance object
                if (responseBodyObject !== null && responseBodyObject.solutionDistance !== null){
                    this.props.onArtieHelpReceived(responseBodyObject.solutionDistance);
                }
            });
        if (this.props.artieExercises.secondsHelpOpen > 0) {
            this.props.onArtieResetSecondsHelpOpen();
        }
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

            reader.readAsDataURL(content);
            reader.onloadend = function () {
                binary = reader.result;
                html2canvas(body).then(canvas => {
                    canvasUrl = canvas.toDataURL('image/png');
                    sendBlockArtie(currentStudent, sprites, currentExercise, false, null, secondsHelpOpen,
                        true, lastLogin, lastExerciseChange, canvasUrl, binary)
                        .then(() => {

                            // Stops the loading help and shows the popup
                            fOnArtieLoadingExercise(false);
                            fOnArtieExerciseSentPopupOpen(true);
                        });
                    if (secondsHelpOpen > 0) {
                        fOnArtieResetSecondsHelpOpen();
                    }
                });
            };
        });
    }
    handleArtieLogout (){
        this.props.onArtieLogout();
        this.props.onArtieClearExercises();
    }
    handleArtieExerciseChange (e){
        exerciseId = e.target.value;
    }
    handleStopEvaluation (){
        this.props.onArtieEvaluationStop(true);
    }
    handleShowPopupStatement (){
        this.props.onArtiePopupStatement(true);
    }
    handleClickRequestEmotionalHelp (){
        this.props.onArtieShowHelpPopup(null, true);
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
                                alt="Scratch"
                                className={classNames(styles.scratchLogo, {
                                    [styles.clickable]: typeof this.props.onClickLogo !== 'undefined'
                                })}
                                draggable={false}
                                src={this.props.logo}
                                onClick={this.props.onClickLogo}
                            />
                        </div>
                        {(this.props.canChangeLanguage) && (<div
                            className={classNames(styles.menuBarItem, styles.hoverable, styles.languageMenu)}
                        >
                            <div>
                                <img
                                    className={styles.languageIcon}
                                    src={languageIcon}
                                />
                                <img
                                    className={styles.languageCaret}
                                    src={dropdownCaret}
                                />
                            </div>
                            <LanguageSelector label={this.props.intl.formatMessage(ariaMessages.language)} />
                        </div>)}
                        {(this.props.canManageFiles) && (
                            <div
                                className={classNames(styles.menuBarItem, styles.hoverable, {
                                    [styles.active]: this.props.fileMenuOpen
                                })}
                                onMouseUp={this.props.onClickFile}
                            >
                                <FormattedMessage
                                    defaultMessage="File"
                                    description="Text for file dropdown menu"
                                    id="gui.menuBar.file"
                                />
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
                            <div className={classNames(styles.editMenu)}>
                                <FormattedMessage
                                    defaultMessage="Edit"
                                    description="Text for edit dropdown menu"
                                    id="gui.menuBar.edit"
                                />
                            </div>
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
                                    {this.props.artieLogin.user == null || (this.props.artieLogin.user.role === 0 && this.props.artieLogin.currentStudent == null) ?
                                        <MenuItem onClick={this.props.onActivateArtieLogin}>
                                            <FormattedMessage
                                                defaultMessage="Login"
                                                description="Menu bar item for login"
                                                id="gui.menuBar.artie.login"
                                            />
                                        </MenuItem> :
                                        <MenuItem onClick={this.handleArtieLogout}>
                                            <FormattedMessage
                                                defaultMessage="Logout"
                                                description="Menu bar item for logout"
                                                id="gui.menuBar.artie.logout"
                                            />
                                        </MenuItem>
                                    }
                                </MenuSection>
                                <MenuSection>
                                    <MenuItem onClick={this.handleClickRequestEmotionalHelp}>
                                        <FormattedMessage
                                            defaultMessage="Emotional Help"
                                            description="Emotional Help"
                                            id="gui.menuBar.artie.emotionalHelp"
                                        />
                                    </MenuItem>
                                </MenuSection>
                                {this.props.artieLogin.user !== null && this.props.artieLogin.user.role === 1 && this.props.artieExercises.currentExercise !== null ?
                                    <MenuSection>
                                        <MenuItem onClick={this.handleClickRegisterSolution}>
                                            <FormattedMessage
                                                defaultMessage="Register solution"
                                                description="Menu bar item for registering a solution"
                                                id="gui.menuBar.artie.registerSolution"
                                            />
                                            {this.props.artieExercises.loadingSolution ?
                                                <Spinner
                                                    small
                                                    className={styles.spinner}
                                                    level={'info'}
                                                /> :
                                                null }
                                        </MenuItem>
                                    </MenuSection> :
                                    null
                                }
                                {this.props.artieLogin.user !== null && this.props.artieLogin.user.role === 0 && this.props.artieLogin.currentStudent !== null &&
                                 this.props.artieExercises.currentExercise !== null && !this.props.artieExercises.currentExercise.evaluation ?
                                    <MenuSection>
                                         <MenuItem onClick={this.handleClickRequestHelp}>
                                            <FormattedMessage
                                                 defaultMessage="Request help"
                                                 description="Menu bar item for requesting help"
                                                 id="gui.menuBar.artie.requestHelp"
                                             />
                                            {this.props.artieExercises.loadingHelp ?
                                                 <Spinner
                                                    small
                                                    className={styles.spinner}
                                                    level={'info'}
                                                /> :
                                                null }
                                        </MenuItem>
                                     </MenuSection> :
                                    null
                                }
                                {this.props.artieLogin.user !== null && this.props.artieLogin.user.role === 0 && this.props.artieLogin.currentStudent !== null &&
                                 this.props.artieExercises.currentExercise !== null && !this.props.artieExercises.currentExercise.evaluation ?
                                    <MenuSection>
                                         <MenuItem onClick={this.handleClickFinishExercise}>
                                            <FormattedMessage
                                                 defaultMessage="Finish exercise"
                                                 description="Menu bar item for finish the exercise"
                                                 id="gui.menuBar.artie.finishExercise"
                                             />
                                            {this.props.artieExercises.loadingExercise ?
                                                 <Spinner
                                                    small
                                                    className={styles.spinner}
                                                    level={'info'}
                                                /> :
                                                null }
                                        </MenuItem>
                                     </MenuSection> :
                                    null
                                }
                            </MenuBarMenu>
                        </div>

                        {this.props.artieLogin.user !== null &&
                            (
                                (this.props.artieLogin.user.role === 0 && this.props.artieLogin.currentStudent !== null) ||
                                this.props.artieLogin.user.role === 1
                            ) ?
                                <React.Fragment>
                                <Divider className={classNames(styles.divider)} />
                                <div
                                        className={classNames(styles.menuBarItem)}
                                    >
                                        <div className={classNames(styles.editMenu)}>

                                        {this.props.artieExercises.currentExercise !== null ?
                                                <React.Fragment>
                                                <ArtieExerciseStatementTooltip
                                                        enable
                                                        tooltipId="artie-exercise"
                                                        place="bottom"
                                                        className={classNames(styles.artieExercisesStatement)}
                                                        tooltipClassName={styles.artieExercisesStatementTooltip}
                                                        message={this.props.artieExercises.currentExercise.description}
                                                    >
                                                        <FormattedMessage
                                                        defaultMessage="Exercise: "
                                                        description="Exercise label"
                                                        id="gui.menuBar.artie.exercise"
                                                    /><label>{this.props.artieExercises.currentExercise.name}</label>
                                                    </ArtieExerciseStatementTooltip>
                                            </React.Fragment> :
                                            <FormattedMessage
                                                    defaultMessage="No exercise selected"
                                                    description="Exercise label"
                                                    id="gui.menuBar.artie.noExercise"
                                                />
                                        }
                                    </div>
                                    </div>

                                { this.props.artieLogin !== null && this.props.artieLogin.user !== null && this.props.artieLogin.user.role === 0 &&
                                  this.props.artieExercises.currentExercise !== null && this.props.artieExercises.currentExercise.evaluation ?
                                      <SelectExerciseButton
                                        className={styles.menuBarButton}
                                        onClick={this.handleStopEvaluation}
                                        isExerciseSelected
                                        evaluation={this.props.artieExercises.currentExercise.evaluation}
                                    /> :
                                    null }

                                { this.props.artieLogin !== null && this.props.artieLogin.user !== null && this.props.artieLogin.user.role === 0 &&
                                  this.props.artieExercises.currentExercise !== null && !this.props.artieExercises.currentExercise.evaluation ?
                                    <React.Fragment>
                                          <Divider className={classNames(styles.divider)} />
                                          <RequestHelpButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleClickRequestHelp}
                                        />
                                      </React.Fragment> :
                                    null }

                                { this.props.artieLogin !== null && this.props.artieLogin.user !== null && this.props.artieLogin.user.role === 0 &&
                                this.props.artieExercises.currentExercise !== null && this.props.artieExercises.currentExercise.evaluation ?
                                    <React.Fragment>
                                        <Divider className={classNames(styles.divider)} />
                                        <StatementButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleShowPopupStatement}
                                        />
                                    </React.Fragment> :
                                    <React.Fragment>
                                        <Divider className={classNames(styles.divider)} />
                                        <SelectExerciseButton
                                            className={styles.menuBarButton}
                                            onClick={this.props.onActivateArtieExercises}
                                            isExerciseSelected={this.props.artieExercises.currentExercise !== null}
                                            evaluation={false}
                                        />
                                        <Divider className={classNames(styles.divider)} />
                                        <StatementButton
                                            className={styles.menuBarButton}
                                            onClick={this.handleShowPopupStatement}
                                        />
                                    </React.Fragment>
                                }
                            </React.Fragment> :
                            null
                        }
                    </div>
                    <Divider className={classNames(styles.divider)} />
                    <div
                        aria-label={this.props.intl.formatMessage(ariaMessages.tutorials)}
                        className={classNames(styles.menuBarItem, styles.hoverable)}
                        onClick={this.props.onOpenTipLibrary}
                    >
                        <img
                            className={styles.helpIcon}
                            src={helpIcon}
                        />
                        <FormattedMessage {...ariaMessages.tutorials} />
                    </div>
                    <Divider className={classNames(styles.divider)} />
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
                        {this.props.canShare ? (
                            (this.props.isShowingProject || this.props.isUpdating) && (
                                <ProjectWatcher onDoneUpdating={this.props.onSeeCommunity}>
                                    {
                                        waitForUpdate => (
                                            <ShareButton
                                                className={styles.menuBarButton}
                                                isShared={this.props.isShared}
                                                /* eslint-disable react/jsx-no-bind */
                                                onClick={() => {
                                                    this.handleClickShare(waitForUpdate);
                                                }}
                                                /* eslint-enable react/jsx-no-bind */
                                            />
                                        )
                                    }
                                </ProjectWatcher>
                            )
                        ) :
                            null
                        }
                        {this.props.canRemix ? remixButton : []}
                    </div>
                    <div className={classNames(styles.menuBarItem, styles.communityButtonWrapper)}>
                        {this.props.enableCommunity ? (
                            (this.props.isShowingProject || this.props.isUpdating) && (
                                <ProjectWatcher onDoneUpdating={this.props.onSeeCommunity}>
                                    {
                                        waitForUpdate => (
                                            <CommunityButton
                                                className={styles.menuBarButton}
                                                /* eslint-disable react/jsx-no-bind */
                                                onClick={() => {
                                                    this.handleClickSeeCommunity(waitForUpdate);
                                                }}
                                                /* eslint-enable react/jsx-no-bind */
                                            />
                                        )
                                    }
                                </ProjectWatcher>
                            )
                        ) :
                            null
                        }
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
                                            />
                                            <span>
                                                {'scratch-cat'}
                                            </span>
                                            <img
                                                className={styles.dropdownCaretIcon}
                                                src={dropdownCaret}
                                            />
                                        </div>
                                    </MenuBarItemTooltip>
                                </React.Fragment>
                            ) : []}
                        </React.Fragment>
                    )}
                </div>

                {aboutButton}

                <ArtieFlow />
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
    canCreateCopy: PropTypes.bool,
    canCreateNew: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canRemix: PropTypes.bool,
    canSave: PropTypes.bool,
    canShare: PropTypes.bool,
    className: PropTypes.string,
    confirmReadyToReplaceProject: PropTypes.func,
    editMenuOpen: PropTypes.bool,
    artieMenuOpen: PropTypes.bool,
    enableCommunity: PropTypes.bool,
    fileMenuOpen: PropTypes.bool,
    intl: intlShape,
    isRtl: PropTypes.bool,
    isShared: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isUpdating: PropTypes.bool,
    languageMenuOpen: PropTypes.bool,
    locale: PropTypes.string.isRequired,
    loginMenuOpen: PropTypes.bool,
    logo: PropTypes.string,
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
    onClickArtie: PropTypes.func,
    onClickLanguage: PropTypes.func,
    onClickLogin: PropTypes.func,
    onClickLogo: PropTypes.func,
    onClickNew: PropTypes.func,
    onClickRemix: PropTypes.func,
    onClickSave: PropTypes.func,
    onClickSaveAsCopy: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onOpenTipLibrary: PropTypes.func,
    onProjectTelemetryEvent: PropTypes.func,
    onRequestOpenAbout: PropTypes.func,
    onRequestCloseAbout: PropTypes.func,
    onRequestCloseAccount: PropTypes.func,
    onRequestCloseEdit: PropTypes.func,
    onRequestCloseFile: PropTypes.func,
    onRequestCloseArtie: PropTypes.func,
    onRequestCloseLanguage: PropTypes.func,
    onRequestCloseLogin: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onShare: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    onActivateArtieLogin: PropTypes.func,
    activateArtieExercises: PropTypes.func,
    deactivateArtieExercises: PropTypes.func,
    projectTitle: PropTypes.string,
    renderLogin: PropTypes.func,
    sessionExists: PropTypes.bool,
    shouldSaveBeforeTransition: PropTypes.func,
    showComingSoon: PropTypes.bool,
    userOwnsProject: PropTypes.bool,
    username: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired
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
        fileMenuOpen: fileMenuOpen(state),
        editMenuOpen: editMenuOpen(state),
        artieMenuOpen: artieMenuOpen(state),
        isRtl: state.locales.isRtl,
        isUpdating: getIsUpdating(loadingState),
        isShowingProject: getIsShowingProject(loadingState),
        languageMenuOpen: languageMenuOpen(state),
        locale: state.locales.locale,
        loginMenuOpen: loginMenuOpen(state),
        projectTitle: state.scratchGui.projectTitle,
        sessionExists: state.session && typeof state.session.session !== 'undefined',
        username: user ? user.username : null,
        userOwnsProject: ownProps.authorUsername && user &&
            (ownProps.authorUsername === user.username),
        vm: state.scratchGui.vm,
        artieLogin: state.scratchGui.artieLogin,
        artieExercises: state.scratchGui.artieExercises,
        artieEmotionalStatus: state.scratchGui.artieEmotionalStatus,
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
    onClickArtie: () => dispatch(openArtieMenu()),
    onRequestCloseArtie: () => dispatch(closeArtieMenu()),
    onClickLanguage: () => dispatch(openLanguageMenu()),
    onRequestCloseLanguage: () => dispatch(closeLanguageMenu()),
    onClickLogin: () => dispatch(openLoginMenu()),
    onRequestCloseLogin: () => dispatch(closeLoginMenu()),
    onRequestOpenAbout: () => dispatch(openAboutMenu()),
    onRequestCloseAbout: () => dispatch(closeAboutMenu()),
    onClickNew: needSave => dispatch(requestNewProject(needSave)),
    onClickRemix: () => dispatch(remixProject()),
    onClickSave: () => dispatch(manualUpdateProject()),
    onClickSaveAsCopy: () => dispatch(saveProjectAsCopy()),
    onSeeCommunity: () => dispatch(setPlayer(true)),
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
    onArtieShowHelpPopup: (id, showHelpPopup) => dispatch(artieShowHelpPopup(id, showHelpPopup))
});

export default compose(
    injectIntl,
    MenuBarHOC,
    connect(
        mapStateToProps,
        mapDispatchToProps
    )
)(MenuBar);
