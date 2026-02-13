'use client';

import { ReactNode } from 'react';
import styles from './AdminTable.module.css';

interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
}

export function AdminTable({ headers, children, emptyMessage }: AdminTableProps) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={styles.header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
      {emptyMessage && (
        <div className={styles.empty}>
          <p>{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

interface AdminTableRowProps {
  children: ReactNode;
  onClick?: () => void;
}

export function AdminTableRow({ children, onClick }: AdminTableRowProps) {
  return (
    <tr className={`${styles.row} ${onClick ? styles.rowClickable : ''}`} onClick={onClick}>
      {children}
    </tr>
  );
}

interface AdminTableCellProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
}

export function AdminTableCell({ children, align = 'left' }: AdminTableCellProps) {
  return (
    <td className={styles.cell} style={{ textAlign: align }}>
      {children}
    </td>
  );
}
