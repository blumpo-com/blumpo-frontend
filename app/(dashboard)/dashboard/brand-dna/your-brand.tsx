'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Upload, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import useSWR from 'swr';
import { useBrand } from '@/lib/contexts/brand-context';
import { Brand } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';
import styles from './your-brand.module.css';

interface BrandData {
  id: string;
  name: string;
  websiteUrl: string;
  language: string;
  fonts: any;
  colors: string[];
  photos: string[];
  logoUrl: string | null;
  insights: {
    brandVoice: string | null;
  } | null;
}

interface YourBrandPageProps {
  brandId: string;
  brandData: BrandData | null;
  isLoading: boolean;
  error: string | null;
  onBrandDataUpdate: (data: BrandData) => void;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

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

export default function YourBrandPage({ brandId, brandData, isLoading: isLoadingData, error: fetchError, onBrandDataUpdate }: YourBrandPageProps) {
  const { currentBrand, setCurrentBrand } = useBrand();
  const router = useRouter();
  const { data: brands, isLoading: isLoadingBrands } = useSWR<Brand[]>('/api/brands', fetcher);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fonts, setFonts] = useState<string[]>([]);
  const [fontInput, setFontInput] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('#000000');
  const [brandVoice, setBrandVoice] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [photos, setPhotos] = useState<string[]>([]);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

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

  // Populate form fields from brandData
  useEffect(() => {
    if (brandData) {
      setLogoUrl(brandData.logoUrl || null);
      // Handle fonts - could be jsonb array of objects or strings
      const fontsArray = Array.isArray(brandData.fonts) ? brandData.fonts : (brandData.fonts ? [brandData.fonts] : []);
      // Extract fontFamily from objects or use string directly
      const fontNames = fontsArray.map((f: any) => {
        if (typeof f === 'string') {
          return f;
        } else if (f && typeof f === 'object' && 'fontFamily' in f) {
          return f.fontFamily;
        }
        return null;
      }).filter((f: any): f is string => f !== null && typeof f === 'string');
      setFonts(fontNames);
      setColors(Array.isArray(brandData.colors) ? brandData.colors : []);
      setBrandVoice(brandData.insights?.brandVoice || '');
      setWebsiteUrl(brandData.websiteUrl || '');
      setLanguage(brandData.language || 'en');
      setPhotos(Array.isArray(brandData.photos) ? brandData.photos : []);
      setInsightsLoaded(brandData.insights !== null);
    }
  }, [brandData]);

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandId', brandId);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const { url } = await response.json();
      setLogoUrl(url);
      
      // Update brand with logo URL
      await saveBrandData({ logoUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId);

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload photo');
        }

        const { url } = await response.json();
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newPhotos = [...photos, ...uploadedUrls];
      setPhotos(newPhotos);
      
      // Update brand with new photos
      await saveBrandData({ photos: newPhotos });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos');
    }
  };

  // Add font
  const handleAddFont = () => {
    const trimmed = fontInput.trim();
    if (trimmed && !fonts.includes(trimmed)) {
      const newFonts = [...fonts, trimmed];
      setFonts(newFonts);
      setFontInput('');
      saveBrandData({ fonts: newFonts });
    }
  };

  // Remove font
  const handleRemoveFont = (font: string) => {
    const newFonts = fonts.filter(f => f !== font);
    setFonts(newFonts);
    saveBrandData({ fonts: newFonts });
  };

  // Add color
  const handleAddColor = () => {
    if (!colors.includes(colorInput)) {
      const newColors = [...colors, colorInput];
      setColors(newColors);
      saveBrandData({ colors: newColors });
    }
  };

  // Remove color
  const handleRemoveColor = (color: string) => {
    const newColors = colors.filter(c => c !== color);
    setColors(newColors);
    saveBrandData({ colors: newColors });
  };

  // Save brand data
  const saveBrandData = async (updates: any) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/brand/${brandId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          brandVoice: brandVoice,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand data');
      }

      const updated = await response.json();
      onBrandDataUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form field changes with debounced save
  const handleBrandVoiceChange = (value: string) => {
    setBrandVoice(value);
  };

  const handleWebsiteUrlChange = (value: string) => {
    setWebsiteUrl(value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    saveBrandData({ language: value });
  };

  // Save brand voice and website URL on blur
  const handleBlur = () => {
    saveBrandData({ 
      websiteUrl: websiteUrl,
      brandVoice: brandVoice,
    });
  };

  // Remove photo
  const handleRemovePhoto = async (photoUrl: string) => {
    const newPhotos = photos.filter(p => p !== photoUrl);
    setPhotos(newPhotos);
    await saveBrandData({ photos: newPhotos });
  };

  if (isLoadingData && !brandData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading brand data...</div>
      </div>
    );
  }

  if (fetchError && !brandData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>Error: {fetchError}</div>
      </div>
    );
  }

  if (!brandData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.grid}>
          {/* Left Column - Brand Assets */}
          <div className={styles.column}>
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
                    width={100}
                    height={100}
                    className={styles.bunnyImage}
                  />
                </div>
                <span className={styles.brandNameText}>{brandData.name}</span>
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
            <div>
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
                    <Upload className={styles.logoUploadIcon} />
                    <p className={styles.logoUploadText}>Upload your brand logo</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
                </div>
                {logoUrl && (
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
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className={styles.hiddenInput}
                />
              </div>
            </div>

            {/* Brand Fonts */}
            <div>
              <Label className={styles.label}>
                Brand fonts
              </Label>
              <div className={styles.fontsList}>
                {fonts.map((font) => (
                  <div
                    key={font}
                    className={styles.fontChip}
                  >
                    <span>{font}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFont(font)}
                      className={styles.fontRemoveButton}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.fontInputContainer}>
                <Input
                  type="text"
                  placeholder="Add font name"
                  value={fontInput}
                  onChange={(e) => setFontInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFont();
                    }
                  }}
                  className={styles.fontInput}
                />
                <Button
                  type="button"
                  onClick={handleAddFont}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label className={styles.label}>
                Colors
              </Label>
              <div className={styles.colorsList}>
                {colors.map((color) => (
                  <div
                    key={color}
                    className={styles.colorSwatchContainer}
                  >
                    <div
                      className={styles.colorSwatch}
                      style={{ backgroundColor: color }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color)}
                      className={styles.colorRemoveButton}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddColor}
                  className={styles.colorAddButton}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className={styles.colorInputContainer}>
                <Input
                  type="color"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  className={styles.colorPicker}
                />
                <Input
                  type="text"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                  placeholder="#000000"
                  className={styles.colorTextInput}
                />
              </div>
            </div>

            {/* Brand Voice */}
            <div>
              <Label className={styles.label}>
                Brand voice
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <textarea
                  value={brandVoice}
                  onChange={(e) => handleBrandVoiceChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Tell us about your brand voice"
                  className={styles.brandVoiceTextarea}
                />
              )}
            </div>
          </div>

          {/* Right Column - General Information */}
          <div className={styles.column}>
            {/* Website URL */}
            <div>
              <Label className={styles.label}>
                Website URL
              </Label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => handleWebsiteUrlChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="https://www.example.com"
                className={styles.websiteUrlInput}
              />
            </div>

            {/* Ads Language */}
            <div>
              <Label className={styles.label}>
                Ads language
              </Label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={styles.languageSelect}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Photos */}
            <div>
              <Label className={styles.label}>
                Product photos
              </Label>
              <div className={styles.photosGrid}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className={styles.photoItem}
                  >
                    <img
                      src={photo}
                      alt={`Product photo ${index + 1}`}
                      className={styles.photoImage}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo)}
                      className={styles.photoRemoveButton}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={styles.addPhotoButton}
                >
                  <Plus className="w-8 h-8" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className={styles.hiddenInput}
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {isSaving && (
          <div className={styles.savingMessage}>
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}
