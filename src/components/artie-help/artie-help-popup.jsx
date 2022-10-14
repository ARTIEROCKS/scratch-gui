import React from 'react';
import Modal from '../../containers/modal.jsx';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import styles from './artie-help-popup.css';
import Box from '../box/box.jsx';
import PropTypes from 'prop-types';
import IconText from '../icon-text/icon-text.jsx';

const messages = defineMessages({
    artieHelpModalTitle: {
        defaultMessage: 'ARTIE Help',
        description: 'ARTIE Help.',
        id: 'gui.menuBar.artie.help.modalTitle'
    }
});

const ArtieHelpPopupComponent = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.onNoClick}
        id="ArtieHelpPopup"
        contentLabel={props.intl.formatMessage(messages.artieHelpModalTitle)}
    >
        <Box className={styles.body}>
            <Box
                className={styles.label}
            >
                <FormattedMessage
                    defaultMessage="How do you feel?"
                    description="How do you feel?"
                    id="gui.artie.emotion.question"
                />
            </Box>
            <Box className={styles.optionsRow}>
                <label>
                    <input
                        name="variableScopeOption"
                        type="radio"
                        value="surprise"
                        onChange={props.onEmotionalStatusChanged}
                    />
                    <IconText
                        img="../../static/emotions/surprise.svg"
                        title="Surprise"
                    />
                </label>
                <label>
                    <input
                        name="variableScopeOption"
                        type="radio"
                        value="happy"
                        onChange={props.onEmotionalStatusChanged}
                    />
                    <IconText
                        img="../../static/emotions/happy.svg"
                        title="Happy"
                    />
                </label>
                <label>
                    <input
                        checked={props.emotionalStateChecked}
                        name="variableScopeOption"
                        type="radio"
                        value="neutral"
                        onChange={props.onEmotionalStatusChanged}
                    />
                    <IconText
                        img="../../static/emotions/neutral.svg"
                        title="Neutral"
                    />
                </label>
                <label>
                    <input
                        name="variableScopeOption"
                        type="radio"
                        value="fear"
                        onChange={props.onEmotionalStatusChanged}
                    />
                    <IconText
                        img="../../static/emotions/fear.svg"
                        title="Fear"
                    />
                </label>
                <label>
                    <input
                        name="variableScopeOption"
                        type="radio"
                        value="sad"
                        onChange={props.onEmotionalStatusChanged}
                    />
                    <IconText
                        img="../../static/emotions/sad.svg"
                        title="Sad"
                    />
                </label>
                <label>
                    <input
                        name="variableScopeOption"
                        type="radio"
                        value="angry"
                        onChange={props.onEmotionalStatusChanged}
                    />
                    <IconText
                        img="../../static/emotions/angry.svg"
                        title="Angry"
                    />
                </label>
            </Box>
            <Box
                className={styles.label}
            >
                <FormattedMessage
                    defaultMessage="Do you need help?"
                    description="Do you need help?"
                    id="gui.artie.help.question"
                />
            </Box>
            <Box className={styles.buttonRow}>
                <button
                    className={styles.yesButton}
                    onClick={props.onYesClick}
                >
                    <FormattedMessage
                        defaultMessage="Yes"
                        description="Yes"
                        id="gui.artie.yes"
                    />
                </button>
                <button
                    className={styles.noButton}
                    onClick={props.onNoClick}
                >
                    <FormattedMessage
                        defaultMessage="No"
                        description="No"
                        id="gui.artie.no"
                    />
                </button>
            </Box>
        </Box>
    </Modal>
);

ArtieHelpPopupComponent.propTypes = {
    onYesClick: PropTypes.func,
    onNoClick: PropTypes.func.isRequired,
    onEmotionalStatusChanged: PropTypes.func.isRequired,
    emotionalStateChecked: PropTypes.bool.isRequired
};

export default injectIntl(ArtieHelpPopupComponent);
