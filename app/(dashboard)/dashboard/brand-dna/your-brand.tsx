'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { X, Plus, Loader2 } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import ContentWrapper from './content-wrapper';
// @ts-ignore - Package will be installed
const languages = require('@cospired/i18n-iso-languages');
// @ts-ignore - Package will be installed
const en = require('@cospired/i18n-iso-languages/langs/en.json');
import styles from './your-brand.module.css';

// Register English locale for language names
languages.registerLocale(en);

interface BrandData {
  id: string;
  name: string;
  websiteUrl: string;
  language: string;
  fonts: any;
  colors: string[];
  photos: string[];
  logoUrl: string | null;
  heroPhotos: string[] | null;
  insights: {
    brandVoice: string | null;
    productDescription: string | null;
    keyFeatures: string[];
    keyBenefits: string[];
    industry: string | null;
    competitors: string[];
    targetCustomers: string[];
    redditCustomerPainPoints: string[];
    insTriggerEvents: string[];
    insAspirations: string[];
  } | null;
}

interface YourBrandPageProps {
  brandId: string;
  brandData: BrandData | null;
  isLoading: boolean;
  error: string | null;
  onBrandDataUpdate: (data: BrandData) => void;
}

// Get all languages as array for dropdown
const getAllLanguages = (): Array<{code: string, name: string}> => {
  // @ts-ignore - Package will be installed
  const codes = languages.getAlpha2Codes();
  // Convert to array if it's an object
  const codesArray = Array.isArray(codes) ? codes : Object.keys(codes);
  return codesArray
    .map((code: string) => {
      // @ts-ignore - Package will be installed
      const name = (languages.getName as (code: string, lang: string) => string | undefined)(code, 'en');
      return name ? { code, name } : null;
    })
    .filter((lang: { code: string; name: string } | null): lang is { code: string; name: string } => lang !== null)
    .sort((a: { code: string; name: string }, b: { code: string; name: string }) => a.name.localeCompare(b.name));
};

// Get language code from name or return as-is if it's already a code
const getLanguageCode = (value: string): string => {
  // Check if it's already a valid 2-letter code
  if (value.length === 2 && (languages.getName as (code: string, lang: string) => string | undefined)(value, 'en')) {
    return value.toLowerCase();
  }
  // Try to find the code by name
  const code = (languages.getAlpha2Code as (name: string, lang: string) => string | undefined)(value, 'en');
  return code || value;
};

// Get language name from code or return as-is if it's already a name
const getLanguageName = (value: string): string => {
  // If it's a 2-letter code, get the name
  if (value.length === 2) {
    const name = (languages.getName as (code: string, lang: string) => string | undefined)(value.toLowerCase(), 'en');
    if (name) return name;
  }
  // If it's already a name, check if it's valid and return it
  const code = (languages.getAlpha2Code as (name: string, lang: string) => string | undefined)(value, 'en');
  if (code) return value; // It's a valid name, return as-is
  // Fallback: try to get name from code
  return (languages.getName as (code: string, lang: string) => string | undefined)(value.toLowerCase(), 'en') || value;
};

export default function YourBrandPage({ brandId, brandData, isLoading: isLoadingData, error: fetchError, onBrandDataUpdate }: YourBrandPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingHeroPhotos, setIsUploadingHeroPhotos] = useState(false);
  const [deletingPhotoUrl, setDeletingPhotoUrl] = useState<string | null>(null);
  
  // Form state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [fonts, setFonts] = useState<Array<{count: number, fontFamily: string}>>([]);
  const [fontInput, setFontInput] = useState('');
  const [isFontInputFocused, setIsFontInputFocused] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('#000000');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [tempColorInput, setTempColorInput] = useState('#000000');
  const [brandVoice, setBrandVoice] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [language, setLanguage] = useState('en');
  const [languageDisplayName, setLanguageDisplayName] = useState<string>('English');
  const [photos, setPhotos] = useState<string[]>([]);
  const [heroPhotos, setHeroPhotos] = useState<string[]>([]);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [allLanguages, setAllLanguages] = useState<Array<{code: string, name: string}>>([]);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const heroPhotoInputRef = useRef<HTMLInputElement>(null);

  // Load all languages on mount
  useEffect(() => {
    setAllLanguages(getAllLanguages());
  }, []);

  // Populate form fields from brandData
  useEffect(() => {
    if (brandData) {
      setLogoUrl(brandData.logoUrl || null);
      // Handle fonts - could be jsonb array of objects or strings (for backward compatibility)
      const fontsArray = Array.isArray(brandData.fonts) ? brandData.fonts : (brandData.fonts ? [brandData.fonts] : []);
      // Convert to object format: if string, convert to object; if already object, use as-is
      const fontsObjects = fontsArray.map((f: any) => {
        if (typeof f === 'string') {
          // Legacy format: string, convert to object with count 1
          return { count: 1, fontFamily: f };
        } else if (f && typeof f === 'object' && 'fontFamily' in f) {
          // Already in object format
          return { count: f.count || 1, fontFamily: f.fontFamily };
        }
        return null;
      }).filter((f): f is {count: number, fontFamily: string} => f !== null);
      setFonts(fontsObjects);
      setColors(Array.isArray(brandData.colors) ? brandData.colors : []);
      setBrandVoice(brandData.insights?.brandVoice || '');
      setWebsiteUrl(brandData.websiteUrl || '');
      
      // Handle language - could be code or full name
      const langValue = brandData.language || 'en';
      // Convert to code for storage, but keep display name
      const langCode = getLanguageCode(langValue);
      setLanguage(langCode);
      // Get display name - if it was already a name, use it; if code, get name
      const displayName = getLanguageName(langValue);
      setLanguageDisplayName(displayName);
      
      setPhotos(Array.isArray(brandData.photos) ? brandData.photos : []);
      setHeroPhotos(Array.isArray(brandData.heroPhotos) ? brandData.heroPhotos : []);
      setInsightsLoaded(brandData.insights !== null);
    }
  }, [brandData, allLanguages]);

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setError(null);
      
      // First, delete old logo if it exists
      if (logoUrl) {
        try {
          await fetch(`/api/delete-photo?url=${encodeURIComponent(logoUrl)}&brandId=${brandId}&type=logo`, {
            method: 'DELETE',
          });
        } catch (deleteErr) {
          // Log error but continue with upload
          console.error('Error deleting old logo:', deleteErr);
        }
      }

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
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handle photo upload (product photos)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingPhotos(true);
      setError(null);
      
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId);
        formData.append('type', 'product');

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
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Handle hero photo upload
  const handleHeroPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingHeroPhotos(true);
      setError(null);
      
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('brandId', brandId);
        formData.append('type', 'hero');

        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload hero photo');
        }

        const { url } = await response.json();
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newHeroPhotos = [...heroPhotos, ...uploadedUrls];
      setHeroPhotos(newHeroPhotos);
      
      // Update brand with new hero photos
      await saveBrandData({ heroPhotos: newHeroPhotos });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload hero photos');
    } finally {
      setIsUploadingHeroPhotos(false);
    }
  };

  // Add font
  const handleAddFont = () => {
    const trimmed = fontInput.trim();
    if (trimmed) {
      // Check if font already exists
      const existingFont = fonts.find(f => f.fontFamily.toLowerCase() === trimmed.toLowerCase());
      if (existingFont) {
        // Font already exists, don't add duplicate
        setFontInput('');
        setIsFontInputFocused(false);
        return;
      }
      
      // Find the highest count in existing fonts
      const highestCount = fonts.length > 0 
        ? Math.max(...fonts.map(f => f.count || 0))
        : 0;
      
      // Add new font with count = highestCount + 1
      const newFont = { count: highestCount + 1, fontFamily: trimmed };
      const newFonts = [...fonts, newFont];
      setFonts(newFonts);
      setFontInput('');
      setIsFontInputFocused(false);
      saveBrandData({ fonts: newFonts });
    }
  };

  // Remove font
  const handleRemoveFont = (fontFamily: string) => {
    const newFonts = fonts.filter(f => f.fontFamily !== fontFamily);
    setFonts(newFonts);
    saveBrandData({ fonts: newFonts });
  };

  // Open color picker
  const handleOpenColorPicker = () => {
    setTempColorInput('#000000');
    setIsColorPickerOpen(true);
  };

  // Add color from picker
  const handleAddColor = () => {
    if (tempColorInput && !colors.includes(tempColorInput)) {
      const newColors = [...colors, tempColorInput];
      setColors(newColors);
      saveBrandData({ colors: newColors });
      setIsColorPickerOpen(false);
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
    const displayName = getLanguageName(value);
    setLanguageDisplayName(displayName);
    saveBrandData({ language: displayName });
  };

  // Save brand voice and website URL on blur
  const handleBlur = () => {
    saveBrandData({ 
      websiteUrl: websiteUrl,
      brandVoice: brandVoice,
    });
  };

  // Remove photo (product photos)
  const handleRemovePhoto = async (photoUrl: string, type: 'product' | 'hero' = 'product') => {
    try {
      setDeletingPhotoUrl(photoUrl);
      setError(null);
      
      // Delete from Vercel Blob
      await fetch(`/api/delete-photo?url=${encodeURIComponent(photoUrl)}&brandId=${brandId}&type=${type}`, {
        method: 'DELETE',
      });

      if (type === 'hero') {
        const newHeroPhotos = heroPhotos.filter(p => p !== photoUrl);
        setHeroPhotos(newHeroPhotos);
        await saveBrandData({ heroPhotos: newHeroPhotos });
      } else {
        const newPhotos = photos.filter(p => p !== photoUrl);
        setPhotos(newPhotos);
        await saveBrandData({ photos: newPhotos });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeletingPhotoUrl(null);
    }
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
            <ContentWrapper
              brandName={brandData.name}
              logoUrl={logoUrl}
              onLogoUpload={handleLogoUpload}
              isUploadingLogo={isUploadingLogo}
            />

            {/* Brand Fonts */}
            <div>
              <Label className={styles.label}>
                Brand fonts
              </Label>
              <div 
                className={styles.fontContainer}
                onClick={(e) => {
                  // Only focus if clicking on white space, not on chips
                  const target = e.target as HTMLElement;
                  const isClickOnChip = target.closest(`.${styles.fontChip}`);
                  const isClickOnPlaceholder = target.classList.contains(styles.fontPlaceholder);
                  
                  // Enter focus mode if clicking on container, fontsList, or placeholder (but not on chips)
                  if (!isClickOnChip || isClickOnPlaceholder) {
                    setIsFontInputFocused(true);
                  }
                }}
              >
                {!isFontInputFocused ? (
                  <div className={styles.fontsList}>
                    {fonts.length > 0 ? (
                      fonts.map((font) => (
                        <div
                          key={font.fontFamily}
                          className={styles.fontChip}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{font.fontFamily}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFont(font.fontFamily);
                            }}
                            className={styles.fontRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className={styles.fontPlaceholder}>Click to add fonts</span>
                    )}
                  </div>
                ) : (
                  <div className={styles.fontInputWrapper}>
                    <input
                      type="text"
                      placeholder="Add font name"
                      value={fontInput}
                      onChange={(e) => setFontInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFont();
                        }
                        if (e.key === 'Escape') {
                          setIsFontInputFocused(false);
                          setFontInput('');
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow button click
                        setTimeout(() => {
                          if (!fontInput.trim()) {
                            setIsFontInputFocused(false);
                          }
                        }, 200);
                      }}
                      autoFocus
                      className={styles.fontInput}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddFont();
                      }}
                      className={styles.fontAddButton}
                      disabled={!fontInput.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                  onClick={handleOpenColorPicker}
                  className={styles.colorAddButton}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Color Picker Dialog */}
              <Dialog open={isColorPickerOpen} onClose={() => setIsColorPickerOpen(false)}>
                <div className={styles.colorPickerDialog}>
                  <h3 className={styles.colorPickerTitle}>Select Color</h3>
                  <div className={styles.colorPickerContent}>
                    <HexColorPicker
                      color={tempColorInput}
                      onChange={setTempColorInput}
                      className={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={tempColorInput}
                      onChange={(e) => setTempColorInput(e.target.value)}
                      placeholder="#000000"
                      className={styles.colorTextInput}
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                    <div className={styles.colorPickerActions}>
                      <Button
                        type="button"
                        className={styles.colorPickerCancelButton}
                        onClick={() => setIsColorPickerOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddColor}
                        disabled={!tempColorInput || colors.includes(tempColorInput)}
                        className={styles.colorPickerAddButton}
                      >
                        Add Color
                      </Button>
                    </div>
                  </div>
                </div>
              </Dialog>
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
              <input
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
                {allLanguages.length > 0 ? (
                  allLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))
                ) : (
                  <option value={language}>{languageDisplayName}</option>
                )}
              </select>
            </div>

            {/* Product Photos */}
            <div>
              <Label className={styles.label}>
                Product photos
              </Label>
              <div className={styles.photosGrid}>
                {/* Display product photos */}
                {photos.map((photo, index) => (
                  <div
                    key={`product-${index}`}
                    className={styles.photoItem}
                  >
                    <img
                      src={photo}
                      alt={`Product photo ${index + 1}`}
                      className={styles.photoImage}
                    />
                    {deletingPhotoUrl === photo && (
                      <div className={styles.photoLoadingOverlay}>
                        <Loader2 className={styles.loadingSpinner} />
                      </div>
                    )}
                    {deletingPhotoUrl !== photo && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo, 'product')}
                        className={styles.photoRemoveButton}
                        disabled={deletingPhotoUrl !== null || isUploadingPhotos || isUploadingHeroPhotos}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {/* Display hero photos */}
                {heroPhotos.map((photo, index) => (
                  <div
                    key={`hero-${index}`}
                    className={styles.photoItem}
                  >
                    <img
                      src={photo}
                      alt={`Hero photo ${index + 1}`}
                      className={styles.photoImage}
                    />
                    {deletingPhotoUrl === photo && (
                      <div className={styles.photoLoadingOverlay}>
                        <Loader2 className={styles.loadingSpinner} />
                      </div>
                    )}
                    {deletingPhotoUrl !== photo && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo, 'hero')}
                        className={styles.photoRemoveButton}
                        disabled={deletingPhotoUrl !== null || isUploadingPhotos || isUploadingHeroPhotos}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {/* Add Product Photo Button */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={styles.addPhotoButton}
                  disabled={isUploadingPhotos || isUploadingHeroPhotos}
                >
                  {isUploadingPhotos ? (
                    <Loader2 className={`w-8 h-8 ${styles.loadingSpinner}`} />
                  ) : (
                    <Plus className="w-8 h-8" />
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className={styles.hiddenInput}
                  disabled={isUploadingPhotos || isUploadingHeroPhotos}
                />
                {/* Add Hero Photo Button */}
                {/* <button
                  type="button"
                  onClick={() => heroPhotoInputRef.current?.click()}
                  className={styles.addPhotoButton}
                  disabled={isUploadingPhotos || isUploadingHeroPhotos}
                >
                  {isUploadingHeroPhotos ? (
                    <Loader2 className={`w-8 h-8 ${styles.loadingSpinner}`} />
                  ) : (
                    <Plus className="w-8 h-8" />
                  )}
                </button>
                <input
                  ref={heroPhotoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleHeroPhotoUpload}
                  className={styles.hiddenInput}
                  disabled={isUploadingPhotos || isUploadingHeroPhotos}
                /> */}
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
