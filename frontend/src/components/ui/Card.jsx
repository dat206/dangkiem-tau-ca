
import styles from './Card.module.css';
import { clsx } from 'clsx';

export const Card = ({ children, className, ...props }) => {
  return (
    <div className={clsx(styles.card, className)} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action, className, ...props }) => {
  return (
    <div className={clsx(styles.header, className)} {...props}>
      <div>
        {title && <h3 className={styles.title}>{title}</h3>}
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent = ({ children, className, ...props }) => {
  return (
    <div className={clsx(styles.content, className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className, ...props }) => {
  return (
    <div className={clsx(styles.footer, className)} {...props}>
      {children}
    </div>
  );
};
