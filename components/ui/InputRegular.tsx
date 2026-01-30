'use client';

import styles from './InputRegular.module.css';

interface InputRegularProps {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  name?: string;
  id?: string;
  onChange?: (value: string) => void;
}

export function InputRegular({
  label,
  value,
  placeholder = 'Input...',
  disabled = false,
  readOnly = false,
  type = 'text',
  name,
  id,
  onChange,
}: InputRegularProps) {
  const inputId = id ?? (name ? `input-${name}` : undefined);
  return (
    <div className={styles.container}>
      <div className={styles.labelWrapper}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      </div>
      <input
        id={inputId}
        type={type}
        name={name}
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
