'use client';

import { useState, useRef } from 'react';
import { useBrand } from '@/lib/contexts/brand-context';
import styles from './photo-selection.module.css';

interface PhotoSelectionContentProps {
  previewPhoto: string | null;
  previewFile: File | null;
  selectedSection: 'current' | 'new';
  onPreviewPhotoChange: (photo: string | null) => void;
  onPreviewFileChange: (file: File | null) => void;
  onSelectedSectionChange: (section: 'current' | 'new') => void;
}

export function PhotoSelectionContent({
  previewPhoto,
  previewFile,
  selectedSection,
  onPreviewPhotoChange,
  onPreviewFileChange,
  onSelectedSectionChange,
}: PhotoSelectionContentProps) {
  const { currentBrand } = useBrand();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get brand photos if available
  const brandPhotos = currentBrand?.photos || [];
  const heroPhotos = currentBrand?.heroPhotos || [];
  const logoPhoto = currentBrand?.logoUrl || '';
  
  // Combine all photos: logo first, then hero photos, then brand photos
  const allBrandPhotos = [...heroPhotos, ...brandPhotos];
  
  const otherPhotos = allBrandPhotos.length > 4 ? allBrandPhotos.slice(allBrandPhotos.length - 4, allBrandPhotos.length).reverse() : allBrandPhotos.reverse();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError(null);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    onPreviewPhotoChange(previewUrl);
    onPreviewFileChange(file);
    onSelectedSectionChange('new');
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    // Toggle selection to new section
    onSelectedSectionChange('new');
    fileInputRef.current?.click();
  };

  const handleRemovePreview = () => {
    if (previewPhoto) {
      URL.revokeObjectURL(previewPhoto);
    }
    onPreviewPhotoChange(null);
    onPreviewFileChange(null);
    onSelectedSectionChange('current');
    setUploadError(null);
  };

  // Photo cards are not selectable - only sections are selectable

  // Determine if sections should have gradient
  const isCurrentSectionSelected = selectedSection === 'current';
  const isNewSectionSelected = selectedSection === 'new' && previewPhoto !== null;

  return (
    <div className={styles.photoSelectionContent}>
      {/* Current Product Photos Section */}
      <div 
        className={`${styles.currentPhotosSection} ${styles.gradientBorder} ${isCurrentSectionSelected ? styles.currentPhotosSectionSelected : ''}`}
        onClick={() => onSelectedSectionChange('current')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectedSectionChange('current');
          }
        }}
      >
        <h2 className={styles.sectionTitle}>Current product photos</h2>
        
        {/* Main photo display */}
        <div className={`${styles.mainPhotoCard} ${styles.gradientBorder}`}>
          <div className={styles.mainPhotoContent}>
            {logoPhoto && (
              <img 
                src={logoPhoto} 
                alt="Main product photo" 
                className={styles.mainPhoto}
              />
            )}
          </div>
        </div>

        {/* Photo collage */}
        <div className={styles.photoCollage}>
          {otherPhotos.map((photo, index) => (
            <div 
              key={`${photo}-${index}`}
              className={`${styles.photoCard} ${styles.gradientBorder}`}
            >
              <div className={styles.photoCardInner}>
                {photo && (
                  <img 
                    src={photo} 
                    alt={`Product photo ${index + 2}`}
                    className={styles.photoImage}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className={styles.separator}>
        <span className={styles.separatorText}>or</span>
      </div>

      {/* Add New Photo Section */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div 
        className={`${styles.addNewPhotoSection} ${styles.gradientBorder} ${isNewSectionSelected ? styles.currentPhotosSectionSelected : ''} ${previewPhoto ? styles.addNewPhotoSectionWithPreview : ''}`}
        onClick={() => !previewPhoto ? handleAddPhotoClick() : onSelectedSectionChange('new')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!previewPhoto) {
              handleAddPhotoClick();
            }
          }
        }}
      >
        <h2 className={styles.sectionTitle}>Add new product photo</h2>
        
        {previewPhoto ? (
          <div className={styles.previewPhotoContainer}>
            <div className={`${styles.previewPhotoCard} ${styles.gradientBorder}`}>
              <img 
                src={previewPhoto} 
                alt="Preview" 
                className={styles.previewPhoto}
              />
              <div className={styles.previewPhotoOverlay}></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePreview();
                }}
                className={styles.cancelButton}
                type="button"
                aria-label="Remove photo"
              >
                <svg width="35" height="35" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.addIconContainer}>
              <div className={styles.addIconCircle}>
                <svg 
                  viewBox="0 0 321 321" 
                  fill="none"
                  className={styles.addIcon}
                >
                  <circle cx="160.5" cy="160.5" r="160.5" fill="url(#addGradient)"/>
                  <path 
                    d="M160.5 80V241M80 160.5H241" 
                    stroke="white" 
                    strokeWidth="20" 
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="addGradient" x1="0" y1="0" x2="321" y2="321" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00BFA6"/>
                      <stop offset="0.5" stopColor="#58C7FF"/>
                      <stop offset="1" stopColor="#0D3B66"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <p className={styles.addPhotoHint}>
              We will focus on this picture in the next ads you create.
            </p>
          </>
        )}
        
        {uploadError && (
          <p className={styles.uploadError}>{uploadError}</p>
        )}
        
        {/* Character illustration - placeholder */}
        <div className={styles.characterIllustration}>
          {/* Character will be added here */}
        </div>
      </div>
    </div>
  );
}

