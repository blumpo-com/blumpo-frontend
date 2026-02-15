"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { User, TokenAccount, Brand } from "@/lib/db/schema";
import { useBrand } from "@/lib/contexts/brand-context";
import { useUser } from "@/lib/contexts/user-context";
import { useRouter } from "next/navigation";
import { getBrandLimit } from "@/lib/constants/brand-limits";
import { ErrorDialog } from "@/components/error-dialog";
import styles from "./dashboard-sidebar.module.css";
import Wand from "@/assets/icons/Wand.svg";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SidebarItemProps {
  href?: string;
  iconSrc: string;
  iconAlt: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

function SidebarItem({
  href,
  iconSrc,
  iconAlt,
  label,
  isActive = false,
  onClick,
}: SidebarItemProps) {
  const className = `${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ""
    }`;

  const content = (
    <>
      <img src={iconSrc} alt={iconAlt} className={styles.sidebarItemIcon} />
      <span className={styles.sidebarItemLabel}>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {content}
    </button>
  );
}

interface BrandDropdownItemProps {
  iconSrc: string;
  iconAlt: string;
  label: string;
  onClick?: () => void;
}

function BrandDropdownItem({
  iconSrc,
  iconAlt,
  label,
  onClick,
}: BrandDropdownItemProps) {
  return (
    <div className={styles.brandDropdownItem} onClick={onClick}>
      <img src={iconSrc} alt={iconAlt} className={styles.brandDropdownIcon} />
      <span className={styles.brandDropdownLabel}>{label}</span>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, isLoading: isLoadingUser } = useUser();
  const { data: brands, isLoading: isLoadingBrands } = useSWR<Brand[]>('/api/brands', fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    keepPreviousData: true,
  });
  const router = useRouter();
  const { currentBrand, setCurrentBrand, isInitialized } = useBrand();
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [brandLimitDialog, setBrandLimitDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    errorCode: string | null;
  }>({ open: false, title: '', message: '', errorCode: null });
  const BrandRef = useRef<HTMLDivElement>(null);

  const tokenBalance = user?.tokenAccount?.balance || 0;
  const planCode = user?.tokenAccount?.planCode ?? 'FREE';
  const brandLimit = getBrandLimit(planCode);
  const isAtBrandLimit = Array.isArray(brands) && brands.length >= brandLimit;
  const isCreateNewActive =
    pathname === "/dashboard" ||
    pathname === "/dashboard/customized-ads";

  // Set first brand as current if none is selected, context is initialized, and brands exist
  useEffect(() => {
    if (
      isInitialized &&
      !currentBrand &&
      Array.isArray(brands) &&
      brands.length > 0
    ) {
      setCurrentBrand(brands[0]);
    }
  }, [brands, currentBrand, setCurrentBrand, isInitialized]);

  // Get current brand name for display, or default to "Brand"
  const currentBrandName = isLoadingBrands
    ? "Loading..."
    : currentBrand?.name || "Brand";

  // Filter out current brand from dropdown list
  const availableBrands = Array.isArray(brands)
    ? brands.filter((brand) => brand.id !== currentBrand?.id)
    : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        BrandRef.current &&
        !BrandRef.current.contains(event.target as Node)
      ) {
        setIsBrandOpen(false);
      }
    }

    if (isBrandOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isBrandOpen]);

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <Link href="/dashboard" className={styles.logo}>
          <img
            src="/assets/logo/Blumpo_Logo.svg"
            alt="Blumpo"
            className={styles.logoImage}
          />
        </Link>
      </div>

      {/* Top Navigation */}
      <nav className={styles.navSection}>
        <Link href="/dashboard" className={styles.createNewButton} >
          <Wand />
          <span>Create new</span>
        </Link>

        <SidebarItem
          href="/dashboard/content-library"
          iconSrc="/assets/icons/Library.svg"
          iconAlt="Content library"
          label="Content library"
          isActive={pathname === "/dashboard/content-library"}
        />
        <SidebarItem
          href="/dashboard/brand-dna"
          iconSrc="/assets/icons/DNA.svg"
          iconAlt="Your brand's DNA"
          label="Your brand's DNA"
          isActive={pathname === "/dashboard/brand-dna"}
        />
      </nav>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNavSection}>
        <div className={styles.brandContainer} ref={BrandRef}>
          <SidebarItem
            iconSrc="/assets/icons/Rocket.svg"
            iconAlt="Brand"
            label={currentBrandName}
            isActive={isBrandOpen}
            onClick={() => {
              setIsBrandOpen(!isBrandOpen);
            }}
          />
          {isBrandOpen && (
            <div className={styles.brandDropdown}>
              <BrandDropdownItem
                iconSrc="/assets/icons/Add.svg"
                iconAlt="New brand"
                label="New brand"
                onClick={() => {
                  setIsBrandOpen(false);
                  if (isAtBrandLimit) {
                    setBrandLimitDialog({
                      open: true,
                      title: 'Brand Limit Reached',
                      message: `Your ${planCode} plan allows up to ${brandLimit === Infinity ? 'unlimited' : brandLimit} brand(s). Upgrade your plan to add more brands.`,
                      errorCode: 'BRAND_LIMIT_REACHED',
                    });
                  } else {
                    router.push('/input-url');
                  }
                }}
              />
              {isLoadingBrands ? (
                <div className={styles.brandDropdownEmpty}>
                  <span>Loading brands...</span>
                </div>
              ) : availableBrands.length > 0 ? (
                availableBrands.map((brand) => (
                  <BrandDropdownItem
                    key={brand.id}
                    iconSrc="/assets/icons/Rocket_black.svg"
                    iconAlt={brand.name}
                    label={brand.name}
                    onClick={() => {
                      setCurrentBrand(brand);
                      setIsBrandOpen(false);
                    }}
                  />
                ))
              ) : Array.isArray(brands) && brands.length > 0 ? null : (
                <div className={styles.brandDropdownEmpty}>
                  <span>No brands yet</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coins Button */}
        <div
          className={styles.coinsButton}
          onClick={() => router.push("/dashboard/your-credits")}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              router.push("/dashboard/your-credits");
            }
          }}
        >
          <img
            src="/assets/icons/Money.svg"
            alt="Coins"
            className={styles.coinsButtonIcon}
          />
          <span className={styles.coinsText}>
            {isLoadingUser ? (
              <span className={styles.coinsBold}>Loading...</span>
            ) : (
              <>
                <span className={styles.coinsBold}>
                  {tokenBalance.toLocaleString()}
                </span>
                <span> coins left</span>
              </>
            )}
          </span>
          <span
            className={styles.addButton}
            style={{ pointerEvents: 'none' }}
            aria-label="Add coins"
          >
            <img
              src="/assets/icons/Add.svg"
              alt="Add coins"
              className={styles.addButtonIcon}
            />
          </span>
        </div>

        <SidebarItem
          href="/dashboard/refer"
          iconSrc="/assets/icons/Gift.svg"
          iconAlt="Refer friends"
          label="Refer friends"
          isActive={pathname === "/dashboard/refer"}
        />
        <SidebarItem
          href="/dashboard/settings"
          iconSrc="/assets/icons/Settings.svg"
          iconAlt="Settings"
          label="Settings"
          isActive={pathname?.includes("/dashboard/security")}
        />
        <SidebarItem
          href="/dashboard/support"
          iconSrc="/assets/icons/Mail.svg"
          iconAlt="Support"
          label="Support"
          isActive={pathname === "/dashboard/support"}
        />
      </nav>

      <ErrorDialog
        open={brandLimitDialog.open}
        onClose={() =>
          setBrandLimitDialog((prev) => ({ ...prev, open: false }))
        }
        title={brandLimitDialog.title}
        message={brandLimitDialog.message}
        errorCode={brandLimitDialog.errorCode}
        primaryButton={{
          label: 'Upgrade Plan',
          onClick: () => router.push('/dashboard/your-credits'),
          variant: 'cta',
        }}
        secondaryButton={{
          label: 'Go Back',
          onClick: () => { },
          variant: 'outline',
        }}
      />
    </aside >
  );
}
