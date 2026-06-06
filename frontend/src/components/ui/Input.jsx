import { forwardRef } from 'react';
import styles from './Input.module.css';
import { clsx } from 'clsx';

const Input = forwardRef(({
  label,
  error,
  iconLeft: IconLeft,
  iconRight: IconRight,
  onIconRightClick,
  className,
  inputClassName,
  ...props
}, ref) => {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {IconLeft && (
          <div className={styles.iconLeft}>
            <IconLeft size={16} />
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            styles.input,
            IconLeft && styles.hasIconLeft,
            IconRight && styles.hasIconRight,
            error && styles.inputError,
            inputClassName
          )}
          {...props}
        />
        {IconRight && (
          <div 
            className={styles.iconRight} 
            onClick={onIconRightClick}
            role={onIconRightClick ? 'button' : undefined}
          >
            <IconRight size={16} />
          </div>
        )}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
