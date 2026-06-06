
import styles from './Table.module.css';
import { clsx } from 'clsx';

export const Table = ({ children, className, ...props }) => {
  return (
    <div className={clsx(styles.tableContainer, className)} {...props}>
      <table className={styles.table}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader = ({ children, ...props }) => {
  return <thead {...props}>{children}</thead>;
};

export const TableBody = ({ children, ...props }) => {
  return <tbody {...props}>{children}</tbody>;
};

export const TableRow = ({ children, className, ...props }) => {
  return <tr className={clsx(styles.tr, className)} {...props}>{children}</tr>;
};

export const TableHead = ({ children, className, ...props }) => {
  return <th className={clsx(styles.th, className)} {...props}>{children}</th>;
};

export const TableCell = ({ children, className, ...props }) => {
  return <td className={clsx(styles.td, className)} {...props}>{children}</td>;
};
