'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/lib/contexts/brand-context';
import { PhotoSelectionContent } from './photo-selection';
import { ArchetypeSelectionContent } from './archetype-selection';
import { FormatSelectionContent } from './format-selection';
import { uploadPhotoAndUpdateGeneration } from './photo-upload';
import styles from './page.module.css';

interface PageHeaderProps {
  title: string;
  description: string;
}

function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.pageTitle}>{title}</h1>
      <p className={styles.pageDescription}>{description}</p>
    </div>
  );
}

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
}

function NavigationButtons({ 
  onBack, 
  onNext, 
  backLabel = "Back", 
  nextLabel = "Next" 
}: NavigationButtonsProps) {
  return (
    <div className={styles.navigationButtons}>
      <button 
        className={styles.backButton}
        onClick={onBack}
        type="button"
      >
        <svg 
          className={styles.arrowIcon} 
          width="16" 
          height="16" 
          viewBox="0 0 11 11" 
          fill="none"
        >
          <path 
            d="M6.5 2.5L4 5L6.5 7.5" 
            stroke="#040404" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        <span>{backLabel}</span>
      </button>
      <button 
        className={styles.nextButton}
        onClick={onNext}
        type="button"
      >
        <span>{nextLabel}</span>
        <svg 
          className={styles.arrowIcon} 
          width="16" 
          height="16" 
          viewBox="0 0 11 11" 
          fill="none"
        >
          <path 
            d="M4.5 2.5L7 5L4.5 7.5" 
            stroke="#F9FAFB" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

function CustomizedAdsPageContent() {
  const router = useRouter();
  const { currentBrand } = useBrand();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Generation job state
  const [jobId, setJobId] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Photo selection state - persisted across steps
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [selectedSection, setSelectedSection] = useState<'current' | 'new'>('current');
  const [productPhotoUrls, setProductPhotoUrls] = useState<string[]>([]);
  const [previousPhotoUrls, setPreviousPhotoUrls] = useState<string[]>([]);
  const [productPhotoMode, setProductPhotoMode] = useState<'brand' | 'custom' | 'mixed'>('brand');
  
  // Archetype selection state
  const [selectedArchetype, setSelectedArchetype] = useState<string>('problem_solution');
  const [archetypeMode, setArchetypeMode] = useState<'single' | 'random'>('single');
  
  // Format selection state
  const [selectedFormat, setSelectedFormat] = useState<string>('1:1');
  const [formats, setFormats] = useState<string[]>([]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewPhoto) {
        URL.revokeObjectURL(previewPhoto);
      }
    };
  }, [previewPhoto]);
  
  // Determine product photo mode based on selection
  useEffect(() => {
    if (selectedSection === 'new' && previewFile) {
      setProductPhotoMode('custom');
    } else if (selectedSection === 'current') {
      setProductPhotoMode('brand');
    }
  }, [selectedSection, previewFile]);
  
  // Determine archetype mode
  useEffect(() => {
    if (selectedArchetype === 'random') {
      setArchetypeMode('random');
    } else {
      setArchetypeMode('single');
    }
  }, [selectedArchetype]);
  
  // Determine formats from selected format
  useEffect(() => {
    if (selectedFormat === '1:1-16:9') {
      setFormats(['1:1', '16:9']);
    } else {
      setFormats([selectedFormat]);
    }
  }, [selectedFormat]);
  
  // Sync to DB when isUploaded is true and state changes
  const syncToDatabase = useCallback(async () => {
    if (!isUploaded || !jobId || !currentBrand?.id || isLoading) return;
    
    setIsLoading(true);
    try {
      // Handle photo changes: upload new photos or detect deletions
      let finalPhotoUrls = [...productPhotoUrls];
      
      // If previewFile exists and is new, upload it
      if (previewFile && selectedSection === 'new' && currentBrand.id) {
        const uploadedUrl = await uploadPhotoAndUpdateGeneration(
          previewFile,
          currentBrand.id,
          jobId
        );
        finalPhotoUrls = [uploadedUrl];
        // Update state but don't trigger another sync
        setProductPhotoUrls(finalPhotoUrls);
        setPreviousPhotoUrls(finalPhotoUrls);
      } else if (selectedSection === 'current') {
        // Use brand photos
        const brandPhotos = currentBrand.photos || [];
        const heroPhotos = currentBrand.heroPhotos || [];
        finalPhotoUrls = [...heroPhotos, ...brandPhotos];
        // Only update if different to avoid loop
        if (JSON.stringify(finalPhotoUrls) !== JSON.stringify(productPhotoUrls)) {
          setProductPhotoUrls(finalPhotoUrls);
          setPreviousPhotoUrls(finalPhotoUrls);
        }
      }
      
      // Convert archetype code format (problem-solution -> problem_solution)
      const archetypeCode = selectedArchetype === 'random' 
        ? null 
        : selectedArchetype.replace(/-/g, '_');
      
      // Update job with current state
      const response = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          brandId: currentBrand.id,
          productPhotoUrls: finalPhotoUrls,
          productPhotoMode,
          archetypeCode,
          archetypeMode,
          formats,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to sync to database');
      }
    } catch (error) {
      console.error('Error syncing to database:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isUploaded, jobId, currentBrand, productPhotoUrls, productPhotoMode, selectedArchetype, archetypeMode, formats, previewFile, selectedSection, isLoading]);
  
  // Use ref to track if we're already syncing to prevent loops
  const isSyncingRef = useRef(false);
  
  // Sync when relevant state changes and isUploaded is true
  useEffect(() => {
    if (isUploaded && !isSyncingRef.current && !isLoading) {
      isSyncingRef.current = true;
      syncToDatabase().finally(() => {
        isSyncingRef.current = false;
      });
    }
    // Remove syncToDatabase from dependencies to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUploaded, productPhotoUrls, productPhotoMode, selectedArchetype, archetypeMode, formats, previewFile, selectedSection]);

  // Step configuration - can be extended for multiple steps
  const stepConfig = {
    1: {
      title: "Choose product photos",
      description: "We will include them in your ad.",
      content: (
        <PhotoSelectionContent
          previewPhoto={previewPhoto}
          previewFile={previewFile}
          selectedSection={selectedSection}
          onPreviewPhotoChange={setPreviewPhoto}
          onPreviewFileChange={setPreviewFile}
          onSelectedSectionChange={setSelectedSection}
        />
      )
    },
    2: {
      title: "Choose ad archetype",
      description: "Select the soul of your ad.",
      content: (
        <ArchetypeSelectionContent
          selectedArchetype={selectedArchetype}
          onSelectedArchetypeChange={setSelectedArchetype}
        />
      )
    },
    3: {
      title: "Select format",
      description: "Select the format for where you'll publish.",
      content: (
        <FormatSelectionContent
          selectedFormat={selectedFormat}
          onSelectedFormatChange={setSelectedFormat}
        />
      )
    }
  };

  const currentConfig = stepConfig[currentStep as keyof typeof stepConfig];

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate to dashboard home
      router.push('/dashboard');
    }
  };

  const handleNext = async () => {
    const maxSteps = Object.keys(stepConfig).length;
    
    // If on final step (format selection), upload everything
    if (currentStep === maxSteps) {
      await handleFinalSubmit();
      return;
    }
    
    // Otherwise, just advance to next step
    setCurrentStep(currentStep + 1);
  };
  
  const handleFinalSubmit = async () => {
    if (!currentBrand?.id) {
      console.error('No brand selected');
      return;
    }
    
    const brandId = currentBrand.id;
    setIsLoading(true);
    try {
      // Create or get job ID
      let currentJobId: string = jobId || '';
      if (!currentJobId) {
        const createResponse = await fetch('/api/generation-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId,
            productPhotoUrls: [],
            productPhotoMode,
            archetypeCode: selectedArchetype === 'random' ? null : selectedArchetype.replace(/-/g, '_'),
            archetypeMode,
            formats,
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create generation job');
        }
        
        const newJob = await createResponse.json();
        currentJobId = newJob.id;
        setJobId(currentJobId);
      }
      
      // Upload photo if there's a preview file
      let finalPhotoUrls: string[] = [];
      if (previewFile) {
        const uploadedUrl = await uploadPhotoAndUpdateGeneration(
          previewFile,
          brandId,
          currentJobId
        );
        finalPhotoUrls = [uploadedUrl];
        setProductPhotoUrls(finalPhotoUrls);
        setPreviousPhotoUrls(finalPhotoUrls);
      } else if (selectedSection === 'current') {
        // Use brand photos
        const brandPhotos = currentBrand.photos || [];
        const heroPhotos = currentBrand.heroPhotos || [];
        finalPhotoUrls = [...heroPhotos, ...brandPhotos];
        setProductPhotoUrls(finalPhotoUrls);
        setPreviousPhotoUrls(finalPhotoUrls);
      }
      
      // Update job with final data
      const updateResponse = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: currentJobId,
          brandId: currentBrand.id,
          productPhotoUrls: finalPhotoUrls,
          productPhotoMode,
          archetypeCode: selectedArchetype === 'random' ? null : selectedArchetype.replace(/-/g, '_'),
          archetypeMode,
          formats,
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update generation job');
      }
      
      setIsUploaded(true);
      
      // TODO: Navigate to results page or show success message
      console.log('Generation job created successfully');
    } catch (error) {
      console.error('Error submitting generation:', error);
      // TODO: Show error message to user
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cleanup on unmount - delete job if not uploaded
  useEffect(() => {
    return () => {
      if (jobId && !isUploaded) {
        fetch(`/api/generation-job?jobId=${jobId}`, {
          method: 'DELETE',
        }).catch(console.error);
      }
    };
  }, [jobId, isUploaded]);

  return (
    <div className={styles.pageContainer}>
      <PageHeader 
        title={currentConfig.title}
        description={currentConfig.description}
      />
      
      <div className={styles.contentArea}>
        {currentConfig.content}
      </div>

      <NavigationButtons 
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}

export default function CustomizedAdsPage() {
  return <CustomizedAdsPageContent />;
}

