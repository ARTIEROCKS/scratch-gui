import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './icon-text.css';

const IconText = ({
    img,
    className,
    title
}) => (
    <div
        className={classNames(
            styles.container,
            className
        )}
    >
        <img
            className={styles.icon}
            draggable={false}
            src={img}
        />
        <div className={styles.title}>
            {title}
        </div>
    </div>
);

IconText.propTypes = {
    className: PropTypes.string,
    img: PropTypes.string,
    title: PropTypes.node.isRequired
};

export default IconText;
