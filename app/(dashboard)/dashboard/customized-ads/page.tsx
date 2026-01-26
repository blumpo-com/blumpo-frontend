'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/lib/contexts/brand-context';
import { PhotoSelectionContent } from './photo-selection';
import { ArchetypeSelectionContent } from './archetype-selection';
import { FormatSelectionContent } from './format-selection';
import { InsightSelectionContent } from './insight-selection';
import { Dialog } from '@/components/ui/dialog';
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
          <img 
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
  
  // Testimonial-specific state (name1 and cta1)
  const [testimonialName, setTestimonialName] = useState<string>('');
  const [testimonialCta, setTestimonialCta] = useState<string>('');
  
  // Brand insights state (cached for reuse across archetypes)
  const [brandInsights, setBrandInsights] = useState<any>(null);
  const [isLoadingBrandInsights, setIsLoadingBrandInsights] = useState(false);
  const brandInsightsBrandIdRef = useRef<string | null>(null);
  const fetchingBrandInsightsRef = useRef<boolean>(false);
  
  // Coming soon dialog state
  const [showComingSoon, setShowComingSoon] = useState(false);

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
      // Clear brand insights when brand changes
      setBrandInsights(null);
      brandInsightsBrandIdRef.current = null;
      router.push('/dashboard');
    }
    prevBrandIdRef.current = currentBrand?.id || null;
  }, [currentBrand?.id, router]);

  // Function to fetch headlines (only for testimonial)
  const fetchHeadlines = useCallback(async () => {
    // Only fetch headlines for testimonial archetype
    if (selectedArchetype !== 'testimonial') {
      setHeadlines([]);
      prevArchetypeRef.current = selectedArchetype;
      return;
    }

    if (!currentBrand?.id) {
      setHeadlinesError('No brand selected');
      return;
    }
    
    // Don't fetch if already loading or if headlines are already loaded for this archetype
    if (isLoadingHeadlines) return;
    if (headlines.length > 0 && prevArchetypeRef.current === 'testimonial' && testimonialName) {
      // Headlines already loaded for testimonial
      return;
    }

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
      // Store testimonial-specific data
      setTestimonialName(data.name1 || '');
      setTestimonialCta(data.cta1 || '');
      prevArchetypeRef.current = selectedArchetype;
      console.log('headlines', data.headlines);
      console.log('testimonial name/cta', data.name1, data.cta1);
    } catch (err) {
      console.error('Error fetching headlines:', err);
      setHeadlinesError(err instanceof Error ? err.message : 'Failed to fetch headlines');
    } finally {
      setIsLoadingHeadlines(false);
    }
  }, [selectedArchetype, currentBrand?.id, isLoadingHeadlines, headlines.length, testimonialName]);

  // Function to fetch brand insights (cached for reuse across archetypes)
  const fetchBrandInsights = useCallback(async () => {
    if (!currentBrand?.id) {
      setHeadlinesError('No brand selected');
      return;
    }

    // If we already have insights for this brand, don't refetch
    if (brandInsights && brandInsightsBrandIdRef.current === currentBrand.id) {
      return;
    }

    // Prevent concurrent fetches
    if (isLoadingBrandInsights || fetchingBrandInsightsRef.current) {
      return;
    }

    fetchingBrandInsightsRef.current = true;
    setIsLoadingBrandInsights(true);
    setHeadlinesError(null);

    try {
      // Fetch brand with insights
      const response = await fetch(`/api/brand/${currentBrand.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch brand insights');
      }

      const brandData = await response.json();
      const insights = brandData.insights || null;
      
      // Store insights for later use
      setBrandInsights(insights);
      brandInsightsBrandIdRef.current = currentBrand.id;
      
      console.log('brand insights fetched', insights);
    } catch (err) {
      console.error('Error fetching brand insights:', err);
      setHeadlinesError(err instanceof Error ? err.message : 'Failed to fetch brand insights');
    } finally {
      setIsLoadingBrandInsights(false);
      fetchingBrandInsightsRef.current = false;
    }
  }, [currentBrand?.id]);

  // Extract insights based on archetype from stored brand insights
  const extractInsightsForArchetype = useCallback((archetype: string) => {
    if (!brandInsights) {
      return [];
    }

    switch (archetype) {
      case 'problem_solution': {
        const redditTargetGroup = brandInsights.targetCustomers || [];
        // Convert to string array
        let painPointsArray: string[] = [];
        
        if (Array.isArray(redditTargetGroup)) {
          painPointsArray = redditTargetGroup.map((item: any) => {
            if (typeof item === 'string') {
              return item;
            } else if (item && typeof item === 'object' && item.text) {
              return item.text;
            } else if (item && typeof item === 'object' && item.painPoint) {
              return item.painPoint;
            }
            return String(item);
          }).filter(Boolean);
        }
        
        // Shuffle and get 6 random items
        const shuffled = [...painPointsArray].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 4);
      }
      // Add other archetypes here as needed
      default:
        return [];
    }
  }, [brandInsights]);

  // Fetch brand insights when needed (only once per brand)
  const hasFetchedBrandInsightsRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentStep < 3) {
      return;
    }

    if (!currentBrand?.id) {
      return;
    }

    // Reset ref when brand changes
    if (hasFetchedBrandInsightsRef.current !== currentBrand.id) {
      hasFetchedBrandInsightsRef.current = null;
    }

    // Fetch brand insights if needed (only once per brand)
    if (
      (!brandInsights || brandInsightsBrandIdRef.current !== currentBrand.id) &&
      !isLoadingBrandInsights &&
      !fetchingBrandInsightsRef.current &&
      hasFetchedBrandInsightsRef.current !== currentBrand.id
    ) {
      hasFetchedBrandInsightsRef.current = currentBrand.id;
      fetchBrandInsights();
    }
  }, [currentStep, currentBrand?.id, brandInsights, fetchBrandInsights, isLoadingBrandInsights]);

  // Load headlines/insights on step 3 (format selection) based on archetype
  const prevStepRef = useRef<number>(1);
  useEffect(() => {
    // Only process when we're on step 3 or later
    if (currentStep < 3) {
      prevStepRef.current = currentStep;
      return;
    }

    // Load data when archetype changes or when navigating to step 3
    if (prevArchetypeRef.current !== selectedArchetype || prevStepRef.current < 3) {
      // Clear testimonial-specific data when switching away from testimonial
      if (prevArchetypeRef.current === 'testimonial' && selectedArchetype !== 'testimonial') {
        setTestimonialName('');
        setTestimonialCta('');
      }
      
      if (selectedArchetype === 'testimonial') {
        // Fetch headlines for testimonial (only if not already loaded)
        if (!headlines.length || prevArchetypeRef.current !== 'testimonial' || !testimonialName) {
          fetchHeadlines();
        }
      } else if (selectedArchetype === 'problem_solution') {
        // Extract insights from stored brand insights
        if (brandInsights) {
          const extractedInsights = extractInsightsForArchetype(selectedArchetype);
          setHeadlines(extractedInsights);
          setIsLoadingHeadlines(false);
          prevArchetypeRef.current = selectedArchetype;
        } else {
          // Wait for brand insights to load
          setIsLoadingHeadlines(true);
        }
      } else {
        // Clear headlines for other archetypes
        setHeadlines([]);
        setIsLoadingHeadlines(false);
        prevArchetypeRef.current = selectedArchetype;
      }
      prevStepRef.current = currentStep;
    }
  }, [selectedArchetype, currentStep, brandInsights, fetchHeadlines, extractInsightsForArchetype, /*headlines.length, testimonialName*/]);
  // Extract insights once brand insights are loaded for problem_solution (on step 3 or later)
  useEffect(() => {
    if (
      currentStep >= 3 && 
      selectedArchetype === 'problem_solution' && 
      brandInsights && 
      brandInsightsBrandIdRef.current === currentBrand?.id &&
      !isLoadingBrandInsights &&
      (!headlines.length || prevArchetypeRef.current !== 'problem_solution')
    ) {
      const extractedInsights = extractInsightsForArchetype(selectedArchetype);
      setHeadlines(extractedInsights);
      setIsLoadingHeadlines(false);
      prevArchetypeRef.current = selectedArchetype;
    }
  }, [currentStep, selectedArchetype, brandInsights, currentBrand?.id, isLoadingBrandInsights, extractInsightsForArchetype, headlines.length]);
  

  // Archetype-specific titles and subtitles for insight selection
  const getInsightStepConfig = () => {
    const configs: Record<string, { title: string; subtitle: string }> = {
      problem_solution: {
        title: "Select target group",
        subtitle: "Customer insights for you product category we found on Reddit and other social media."
      },
      testimonial: {
        title: "Select testimonials",
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
    
    // Check if moving to insight selection step with unsupported archetype
    if (currentStep === 3 && currentStep + 1 === maxSteps) {
      const unsupportedArchetypes = ['competitor_comparison', 'promotion_offer', 'value_proposition', 'random'];
      if (unsupportedArchetypes.includes(selectedArchetype)) {
        setShowComingSoon(true);
        return;
      }
    }
    
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

      // If insight source is auto, set selected insights to random 2 headlines
      let autoSelectedInsights: string[] = [];
      if (insightSource === 'auto') {
        autoSelectedInsights = headlines.slice(0, 2);
      }
      
      // Convert archetype code format (problem-solution -> problem_solution)
      const archetypeCode = selectedArchetype === 'random' 
        ? null 
        : selectedArchetype.replace(/-/g, '_');
      
      // Build archetype inputs based on archetype type
      let archetypeInputs: Record<string, any> = {};
      if (selectedArchetype === 'testimonial') {
        // Store testimonial-specific inputs
        archetypeInputs = {
          name1: testimonialName,
          cta1: testimonialCta,
        };
      }
      
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
          selectedInsights: insightSource === 'auto' ? autoSelectedInsights : selectedInsights,
          insightSource,
          promotionValueInsight: {}, // Can be extended later with specific promotion data
          archetypeInputs,
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

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoon} onClose={() => setShowComingSoon(false)}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>Coming Soon</h2>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          This archetype is not yet available. Please select a different archetype.
        </p>
        <button
          onClick={() => setShowComingSoon(false)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#040404',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          OK
        </button>
      </Dialog>
    </div>
  );
}

export default function CustomizedAdsPage() {
  return <CustomizedAdsPageContent />;
}

