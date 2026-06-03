import React from 'react';
import styles from './Badge.module.css';
import { clsx } from 'clsx';

const Badge = ({ children, variant = 'gray', className, ...props }) => {
  return (
    <span className={clsx(styles.badge, styles[variant], className)} {...props}>
      {children}
    </span>
  );
};

export default Badge;
