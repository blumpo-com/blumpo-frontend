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
  const brandNameTextRef = useRef<HTMLSpanElement>(null);
  const brandNameInnerRef = useRef<HTMLDivElement>(null);

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

  // Adjust font size to fit max width
  useEffect(() => {
    const adjustFontSize = () => {
      const textElement = brandNameTextRef.current;
      const containerElement = brandNameInnerRef.current;
      
      if (!textElement || !containerElement) return;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Get available width (container width minus padding and chevron space)
        const containerWidth = containerElement.offsetWidth;
        const padding = 24; // 1.5rem = 24px
        const chevronWidth = 25;
        const chevronRightMargin = 25; // 1.5rem
        const buffer = 8; // Small buffer to prevent edge cases
        const maxWidth = containerWidth - (padding * 2) - chevronWidth - chevronRightMargin - buffer;

        // Set max-width as CSS custom property
        containerElement.style.setProperty('--brand-name-max-width', `${maxWidth}px`);

        // Start with base font size to measure
        const baseFontSize = 32; // 2rem = 32px
        textElement.style.setProperty('font-size', `${baseFontSize}px`);

        // Measure text width
        const textWidth = textElement.scrollWidth;

        // Calculate font size to fit max width
        let fontSize = baseFontSize;
        if (textWidth > maxWidth) {
          fontSize = (maxWidth / textWidth) * baseFontSize;
          // Set minimum font size to prevent it from getting too small
          fontSize = Math.max(fontSize, 16); // Minimum 1rem
        }

        // Set font size as CSS custom property
        containerElement.style.setProperty('--brand-name-font-size', `${fontSize}px`);
      });
    };

    // Small delay to ensure container is rendered
    const timeoutId = setTimeout(adjustFontSize, 0);
    
    // Adjust on window resize
    window.addEventListener('resize', adjustFontSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', adjustFontSize);
    };
  }, [brandName]);

  return (
    <>
      {/* Brand Name Container */}
      <div className={styles.brandNameContainer} ref={brandDropdownRef}>
        <div
          ref={brandNameInnerRef}
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
          <span ref={brandNameTextRef} className={styles.brandNameText}>{brandName}</span>
          <div className={`${styles.chevronWrapper} ${isBrandDropdownOpen ? styles.chevronRotated : ''}`}>
            <ChevronDown
              size={28}
              strokeWidth={2}
            />
          </div>
        </div>
        {isBrandDropdownOpen && (
          <div className={styles.brandDropdown}>
           
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
              )
            )
            ) : Array.isArray(brands) && brands.length > 0 ? null : (
              <div className={styles.brandDropdownEmpty}>
                <span>No brands yet</span>
              </div>
            )}
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
