'use client';

import styles from './InputRegular.module.css';

interface InputRegularProps {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  onChange?: (value: string) => void;
}

export function InputRegular({
  label,
  value,
  placeholder = 'Input...',
  disabled = false,
  readOnly = false,
  type = 'text',
  onChange,
}: InputRegularProps) {
  return (
    <div className={styles.container}>
      <div className={styles.labelWrapper}>
        <label className={styles.label}>{label}</label>
      </div>
      <input
        type={type}
        className={styles.input}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
