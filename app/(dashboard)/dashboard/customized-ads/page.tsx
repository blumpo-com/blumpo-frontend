'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useBrand } from '@/lib/contexts/brand-context';
import { PhotoSelectionContent } from './photo-selection';
import { ArchetypeSelectionContent } from './archetype-selection';
import { FormatSelectionContent } from './format-selection';
import { InsightSelectionContent } from './insight-selection';
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
  nextLabel = "Next",
  showRandomIcon = false
}: NavigationButtonsProps & { showRandomIcon?: boolean }) {
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
        className={`${styles.nextButton} ${showRandomIcon ? styles.chooseRandom : ''}`}
        onClick={onNext}
        type="button"
      >
        <span>{nextLabel}</span>
        {showRandomIcon ? (
          <Image
            src="/assets/icons/Wand.svg"
            alt="Magic wand"
            className={styles.magicWandIcon}
            width={16}
            height={16}
          />
        ) : (
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
        )}
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

  // Insight selection state
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [isLoadingHeadlines, setIsLoadingHeadlines] = useState(false);
  const [headlinesError, setHeadlinesError] = useState<string | null>(null);
  const prevArchetypeRef = useRef<string | null>(null);

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

  // Navigate to dashboard when brand changes (but not on initial mount)
  const prevBrandIdRef = useRef<string | null>(null);
  const isInitialMountRef = useRef(true);
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevBrandIdRef.current = currentBrand?.id || null;
      return;
    }

    if (prevBrandIdRef.current && currentBrand?.id && prevBrandIdRef.current !== currentBrand.id) {
      router.push('/dashboard');
    }
    prevBrandIdRef.current = currentBrand?.id || null;
  }, [currentBrand?.id, router]);

  // Simple function to fetch headlines
  const fetchHeadlines = useCallback(async () => {
    if (currentStep !== 3) return;

    if (!selectedArchetype || selectedArchetype === 'random') {
      setHeadlines([]);
      prevArchetypeRef.current = selectedArchetype;
      return;
    }

    if (!currentBrand?.id) {
      setHeadlinesError('No brand selected');
      return;
    }
    if (isLoadingHeadlines) return;

    setIsLoadingHeadlines(true);
    setHeadlinesError(null);

    try {
      console.log('fetching headlines');
      const response = await fetch('/api/headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archetypeId: selectedArchetype,
          brandId: currentBrand.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch headlines');
      }

      const data = await response.json();
      setHeadlines(data.headlines || []);
      prevArchetypeRef.current = selectedArchetype;
      console.log('headlines', data.headlines);
    } catch (err) {
      console.error('Error fetching headlines:', err);
      setHeadlinesError(err instanceof Error ? err.message : 'Failed to fetch headlines');
    } finally {
      setIsLoadingHeadlines(false);
    }
  }, [selectedArchetype, currentBrand?.id, currentStep]);

  // Fetch headlines when archetype changes
  useEffect(() => {
    if (prevArchetypeRef.current !== selectedArchetype) {
      fetchHeadlines();
    }
  }, [selectedArchetype, fetchHeadlines]);


  // Archetype-specific titles and subtitles for insight selection
  const getInsightStepConfig = () => {
    const configs: Record<string, { title: string; subtitle: string }> = {
      problem_solution: {
        title: "Select Insight",
        subtitle: "Customer insights for you product category we found on Reddit and other social media."
      },
      testimonial: {
        title: "Select Insight",
        subtitle: "Customer insights for you product category we found on Reddit and other social media."
      },
      competitor_comparison: {
        title: "Competitor insight",
        subtitle: "Competitor insights for you product category we found on Reddit & Social media"
      },
      promotion_offer: {
        title: "Value insight",
        subtitle: "Customer value perception of your product we found on Reddit & Social media"
      },
      value_proposition: {
        title: "Value insight",
        subtitle: "Customer value perception of your product we found on Reddit & Social media"
      },
      random: {
        title: "Select Insight",
        subtitle: "Choose headlines for your ad"
      }
    };

    return configs[selectedArchetype] || configs.problem_solution;
  };

  // Step configuration - can be extended for multiple steps
  const insightConfig = useMemo(() => getInsightStepConfig(), [selectedArchetype]);

  const stepConfig = useMemo(() => ({
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
    },
    4: {
      title: insightConfig.title,
      description: insightConfig.subtitle,
      content: (
        <InsightSelectionContent
          selectedArchetype={selectedArchetype}
          headlines={headlines}
          isLoading={isLoadingHeadlines}
          error={headlinesError}
          onRetry={fetchHeadlines}
          selectedInsights={selectedInsights}
          onSelectedInsightsChange={setSelectedInsights}
        />
      )
    }
  }), [previewPhoto, previewFile, selectedSection, selectedArchetype, selectedFormat, selectedInsights, insightConfig, headlines, isLoadingHeadlines, headlinesError]);

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

    // Headlines are now fetched automatically when archetype changes via useEffect
    // No need to fetch here unless we need to ensure they're loaded before step 3

    // If on final step (insight selection), upload everything
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
      // Determine final photo URLs
      let finalPhotoUrls: string[] = [];

      // Upload photo if there's a preview file
      if (previewFile) {
        const formData = new FormData();
        formData.append('file', previewFile);
        formData.append('brandId', brandId);

        const uploadResponse = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || 'Failed to upload photo');
        }

        const { url } = await uploadResponse.json();
        finalPhotoUrls = [url];
      } else if (selectedSection === 'current') {
        // Use brand photos
        const brandPhotos = currentBrand.photos || [];
        const heroPhotos = currentBrand.heroPhotos || [];
        finalPhotoUrls = [...heroPhotos, ...brandPhotos];
      }

      // Determine insight source based on selection
      // If user selected insights manually, it's 'manual', otherwise 'auto'
      const insightSource = selectedInsights.length > 0 ? 'manual' : 'auto';

      // Convert archetype code format (problem-solution -> problem_solution)
      const archetypeCode = selectedArchetype === 'random'
        ? null
        : selectedArchetype.replace(/-/g, '_');

      // Create generation job with all data
      const createResponse = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          productPhotoUrls: finalPhotoUrls,
          productPhotoMode,
          archetypeCode,
          archetypeMode,
          formats,
          selectedInsights,
          insightSource,
          promotionValueInsight: {}, // Can be extended later with specific promotion data
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create generation job');
      }

      const newJob = await createResponse.json();
      setJobId(newJob.id);
      setProductPhotoUrls(finalPhotoUrls);
      setPreviousPhotoUrls(finalPhotoUrls);
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

  // Navigate to ad generation page after upload
  useEffect(() => {
    if (isUploaded && jobId) {
      router.push(`/dashboard/ad-generation?job_id=${jobId}`);
    }
  }, [isUploaded, jobId, router]);

  return (
    <div className={styles.pageContainer}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Processing...</p>
          </div>
        </div>
      )}
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
        nextLabel={currentStep === 4 && selectedInsights.length === 0 ? "Choose random" : "Next"}
        showRandomIcon={currentStep === 4 && selectedInsights.length === 0}
      />
    </div>
  );
}

export default function CustomizedAdsPage() {
  return <CustomizedAdsPageContent />;
}

