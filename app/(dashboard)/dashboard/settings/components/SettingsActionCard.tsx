'use client';

import { ReactNode } from 'react';
import ChevronRight from '@/assets/icons/Chevron-right.svg';
import styles from './SettingsActionCard.module.css';

interface SettingsActionCardProps {
  icon: ReactNode;
  title: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function SettingsActionCard({
  icon,
  title,
  onClick,
  disabled = false,
}: SettingsActionCardProps) {
  return (
    <div
      className={`${styles.card} ${disabled ? styles.disabled : styles.clickable}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className={styles.cardContent}>
        <div className={styles.cardIconWrapper}>{icon}</div>
        <span className={styles.cardTitle}>{title}</span>
      </div>
      <div className={styles.chevronButton}>
        <div className={styles.chevronCircle}>
          <ChevronRight className={styles.chevronIcon} />
        </div>
      </div>
    </div>
  );
}
