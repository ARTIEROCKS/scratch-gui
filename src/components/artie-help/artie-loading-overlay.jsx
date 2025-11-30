/* eslint-disable no-multiple-empty-lines */
import classNames from 'classnames';
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';

import Spinner from '../spinner/spinner.jsx';
import styles from './artie-loading-overlay.css';

const ArtieLoadingOverlay = ({
    className
}) => (
    ReactDOM.createPortal(
        <div className={classNames(styles['artie-loading-overlay'], className)}>
            <div className={styles['artie-loading-overlay__content']}>
                <Spinner
                    large
                    level="info"
                />
                <div className={styles['artie-loading-overlay__text']}>
                    <FormattedMessage
                        defaultMessage="Calculando tu ayuda..."
                        description="Overlay text shown while waiting for ARTIE help response"
                        id="gui.artie.loadingHelp"
                    />
                </div>
            </div>
        </div>,
        document.body
    )
);

ArtieLoadingOverlay.propTypes = {
    className: PropTypes.string
};

export default ArtieLoadingOverlay; // EOF
