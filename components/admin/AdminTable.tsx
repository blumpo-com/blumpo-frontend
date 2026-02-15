'use client';

import { ReactNode } from 'react';
import styles from './AdminTable.module.css';

interface AdminTableProps {
  headers: string[];
  children: ReactNode;
  emptyMessage?: string;
  /** Enable horizontal scroll when table content is wider than container */
  scrollable?: boolean;
}

export function AdminTable({ headers, children, emptyMessage, scrollable }: AdminTableProps) {
  return (
    <div className={`${styles.tableWrapper} ${scrollable ? styles.tableWrapperScrollable : ''}`}>
      <table className={`${styles.table} ${scrollable ? styles.tableScrollable : ''}`}>
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
  className?: string;
}

export function AdminTableRow({ children, onClick, className }: AdminTableRowProps) {
  return (
    <tr
      className={`${styles.row} ${onClick ? styles.rowClickable : ''} ${className || ''}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface AdminTableCellProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  onClick?: (e: React.MouseEvent) => void;
}

export function AdminTableCell({ children, align = 'left', onClick }: AdminTableCellProps) {
  return (
    <td className={styles.cell} style={{ textAlign: align }} onClick={onClick}>
      {children}
    </td>
  );
}
