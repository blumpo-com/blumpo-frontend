'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { useBrand } from '@/lib/contexts/brand-context';
import { Brand } from '@/lib/db/schema';
import styles from './content-wrapper.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface BrandDropdownItemProps {
  iconSrc: string;
  iconAlt: string;
  label: string;
  onClick?: () => void;
}

function BrandDropdownItem({ iconSrc, iconAlt, label, onClick }: BrandDropdownItemProps) {
  return (
    <div className={styles.brandDropdownItem} onClick={onClick}>
      <img src={iconSrc} alt={iconAlt} className={styles.brandDropdownIcon} />
      <span className={styles.brandDropdownLabel}>{label}</span>
    </div>
  );
}

interface ContentWrapperProps {
  brandName: string;
  logoUrl: string | null;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingLogo?: boolean;
}

export default function ContentWrapper({
  brandName,
  logoUrl,
  onLogoUpload,
  isUploadingLogo = false
}: ContentWrapperProps) {
  const { currentBrand, setCurrentBrand } = useBrand();
  const router = useRouter();
  const { data: brands, isLoading: isLoadingBrands } = useSWR<Brand[]>('/api/brands', fetcher);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Filter out current brand from dropdown list
  const availableBrands = Array.isArray(brands) ? brands.filter((brand) => brand.id !== currentBrand?.id) : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    }

    if (isBrandDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isBrandDropdownOpen]);

  return (
    <>
      {/* Brand Name Container */}
      <div className={styles.brandNameContainer} ref={brandDropdownRef}>
        <div
          className={styles.brandNameInner}
          onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.bunnyWrapper}>
            <Image
              src="/images/temp/blumpo_sitting.png"
              alt="Blumpo"
              width={120}
              height={110}
              className={styles.bunnyImage}
            />
          </div>
          <span className={styles.brandNameText}>{brandName}</span>
          <div className={`${styles.chevronWrapper} ${isBrandDropdownOpen ? styles.chevronRotated : ''}`}>
            <ChevronDown
              size={28}
              strokeWidth={2}
            />
          </div>
        </div>
        {isBrandDropdownOpen && (
          <div className={styles.brandDropdown}>
            <BrandDropdownItem
              iconSrc="/assets/icons/Add.svg"
              iconAlt="New brand"
              label="New brand"
              onClick={() => {
                console.log('New brand clicked');
                setIsBrandDropdownOpen(false);
                // TODO: Navigate to create new brand page or open modal
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
                    setIsBrandDropdownOpen(false);
                    router.refresh();
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

      {/* Brand Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoInner}>
          {logoUrl ? (
            <div className={styles.logoDisplay}>
              <img
                src={logoUrl}
                alt="Brand logo"
                className={styles.logoImage}
              />
            </div>
          ) : (
            <div className={styles.logoUploadContainer}>
              {isUploadingLogo ? (
                <Loader2 className={styles.loadingSpinner} />
              ) : (
                <>
                  <p className={styles.logoUploadText}>Upload your brand logo</p>
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className={styles.logoUploadButton}
                    disabled={isUploadingLogo}
                  >
                    Choose File
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {logoUrl && !isUploadingLogo && onLogoUpload && (
          <div
            className={styles.logoEditOverlay}
            onClick={() => logoInputRef.current?.click()}
          >
            <img
              src="/assets/icons/edit.svg"
              alt="Edit logo"
              className={styles.logoEditIcon}
            />
          </div>
        )}
        {onLogoUpload && (
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={onLogoUpload}
            className={styles.hiddenInput}
            disabled={isUploadingLogo}
          />
        )}
        {isUploadingLogo && (
          <div className={styles.photoLoadingOverlay}>
            <Loader2 className={styles.loadingSpinner} />
          </div>
        )}
      </div>
    </>
  );
}
