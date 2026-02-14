'use client';

import { ReactNode } from 'react';
import styles from './AdminCard.module.css';

interface AdminCardProps {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AdminCard({ title, children, actions }: AdminCardProps) {
  return (
    <div className={styles.card}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}
