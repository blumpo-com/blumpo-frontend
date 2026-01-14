'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBrand } from '@/lib/contexts/brand-context';
import { FormatSelectionContent } from '../customized-ads/format-selection';
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

function QuickAdsGenerationPageContent() {
  const router = useRouter();
  const { currentBrand } = useBrand();
  const [selectedFormat, setSelectedFormat] = useState<string>('1:1');
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  // Map format selection IDs to database format values
  const mapFormatToDatabase = (formatId: string): string[] => {
    switch (formatId) {
      case '1:1':
        return ['square'];
      case '16:9':
        return ['story'];
      case '1:1-16:9':
        return ['square', 'story'];
      default:
        return ['square'];
    }
  };

  // Handle format selection - only updates state
  const handleFormatSelected = (formatId: string) => {
    if (isCreatingJob) return;
    setSelectedFormat(formatId);
  };

  // Handle back button - navigate to dashboard
  const handleBack = () => {
    router.push('/dashboard');
  };

  // Handle next button - create job and navigate
  const handleNext = async () => {
    if (isCreatingJob) return;
    
    setIsCreatingJob(true);

    try {
      const brandId = currentBrand?.id || null;
      const formats = mapFormatToDatabase(selectedFormat);

      // Create generation job with minimal data
      const createResponse = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          productPhotoUrls: [],
          productPhotoMode: 'brand',
          archetypeCode: null,
          archetypeMode: 'single',
          formats,
          selectedInsights: [],
          insightSource: 'auto',
          promotionValueInsight: {},
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create generation job');
      }

      const newJob = await createResponse.json();
      setJobId(newJob.id);

      // Navigate to ad generation page
      router.push(`/dashboard/ad-generation?job_id=${newJob.id}`);
    } catch (error) {
      console.error('Error creating generation job:', error);
      setIsCreatingJob(false);
      // TODO: Show error message to user
    }
  };

  return (
    <div className={styles.pageContainer}>
      {isCreatingJob && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Processing...</p>
          </div>
        </div>
      )}
      <PageHeader 
        title="Select format"
        description="Select the format for where you'll publish."
      />
      
      <div className={styles.contentArea}>
        <FormatSelectionContent
          selectedFormat={selectedFormat}
          onSelectedFormatChange={handleFormatSelected}
        />
      </div>

      <NavigationButtons 
        onBack={handleBack}
        onNext={handleNext}
      />
    </div>
  );
}

export default function QuickAdsGenerationPage() {
  return <QuickAdsGenerationPageContent />;
}

