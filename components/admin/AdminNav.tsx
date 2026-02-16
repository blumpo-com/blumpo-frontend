'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Briefcase, 
  BarChart3, 
  CreditCard, 
  AlertTriangle,
  Settings
} from 'lucide-react';
import styles from './AdminNav.module.css';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link 
      href={href} 
      className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <NavItem
        href="/admin"
        icon={<LayoutDashboard className={styles.navIcon} />}
        label="Dashboard"
        isActive={pathname === '/admin' || pathname === '/admin/'}
      />
      <NavItem
        href="/admin/users"
        icon={<Users className={styles.navIcon} />}
        label="Users"
        isActive={pathname?.startsWith('/admin/users')}
      />
      <NavItem
        href="/admin/brands"
        icon={<Building2 className={styles.navIcon} />}
        label="Brands"
        isActive={pathname?.startsWith('/admin/brands')}
      />
      <NavItem
        href="/admin/jobs"
        icon={<Briefcase className={styles.navIcon} />}
        label="Generation Jobs"
        isActive={pathname?.startsWith('/admin/jobs')}
      />
      <NavItem
        href="/admin/analytics"
        icon={<BarChart3 className={styles.navIcon} />}
        label="Analytics"
        isActive={pathname?.startsWith('/admin/analytics')}
      />
      <NavItem
        href="/admin/subscriptions"
        icon={<CreditCard className={styles.navIcon} />}
        label="Subscriptions"
        isActive={pathname?.startsWith('/admin/subscriptions')}
      />
      <NavItem
        href="/admin/workflow-errors"
        icon={<AlertTriangle className={styles.navIcon} />}
        label="Workflow Errors"
        isActive={pathname?.startsWith('/admin/workflow-errors')}
      />
    </nav>
  );
}
