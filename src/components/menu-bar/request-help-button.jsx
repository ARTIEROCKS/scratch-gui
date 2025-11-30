import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

import styles from './request-help-button.css';


const RequestHelpButton = ({
    className,
    onClick,
    disabled
}) => (
    <Button
        className={classNames(
            className,
            styles.selectExerciseButton,
            { [styles.disabled]: disabled }
        )}
        onClick={onClick}
        disabled={disabled}
        aria-disabled={disabled}
    >
        <FormattedMessage
            defaultMessage="Request help"
            description="Menu bar item for requesting help"
            id="gui.menuBar.artie.requestHelp"
        />
    </Button>
);

RequestHelpButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool
};

RequestHelpButton.defaultProps = {
    onClick: () => {},
    disabled: false
};

export default RequestHelpButton;
