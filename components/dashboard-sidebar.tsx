'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Wand2,
  Library,
  Dna,
  Rocket,
  Coins,
  Plus,
  Gift,
  Settings,
  Mail,
} from 'lucide-react';
import useSWR from 'swr';
import { User, TokenAccount } from '@/lib/db/schema';
import styles from './dashboard-sidebar.module.css';

type UserWithTokenAccount = User & {
  tokenAccount: TokenAccount | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SidebarItemProps {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SidebarItem({
  href,
  icon: Icon,
  label,
  isActive = false,
  onClick,
}: SidebarItemProps) {
  const className = `${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`;

  const content = (
    <>
      <Icon className={styles.sidebarItemIcon} />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={className}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: user } = useSWR<UserWithTokenAccount>('/api/user', fetcher);
  
  const tokenBalance = user?.tokenAccount?.balance || 0;

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <Link href="/dashboard" className={styles.logo}>
          blumpo
        </Link>
      </div>

      {/* Top Navigation */}
      <nav className={styles.navSection}>
        <Link
          href="/dashboard"
          className={styles.createNewButton}
        >
          <Wand2 className={styles.createNewButtonIcon} />
          <span>Create new</span>
        </Link>
        <SidebarItem
          href="/dashboard/library"
          icon={Library}
          label="Content library"
          isActive={pathname === '/dashboard/library'}
        />
        <SidebarItem
          href="/dashboard/brand-dna"
          icon={Dna}
          label="Your brand's DNA"
          isActive={pathname === '/dashboard/brand-dna'}
        />
      </nav>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNavSection}>
        <SidebarItem
          icon={Rocket}
          label="Scrolly"
          isActive={false}
          onClick={() => {
            console.log('Scrolly clicked');
          }}
        />
        
        {/* Coins Button */}
        <button className={styles.coinsButton}>
          <Coins className={styles.coinsButtonIcon} />
          <span className={styles.coinsText}>
            <span className={styles.coinsBold}>{tokenBalance.toLocaleString()}</span>
            <span> coins left</span>
          </span>
          <button
            className={styles.addButton}
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Handle add coins
            }}
          >
            <Plus className={styles.addButtonIcon} />
          </button>
        </button>

        <SidebarItem
          href="/dashboard/refer"
          icon={Gift}
          label="Refer friends"
          isActive={pathname === '/dashboard/refer'}
        />
        <SidebarItem
          href="/dashboard/general"
          icon={Settings}
          label="Settings"
          isActive={pathname?.includes('/dashboard/security') || pathname === '/dashboard/general' || pathname === '/dashboard'}
        />
        <SidebarItem
          href="/dashboard/support"
          icon={Mail}
          label="Support"
          isActive={pathname === '/dashboard/support'}
        />
      </nav>
    </aside>
  );
}