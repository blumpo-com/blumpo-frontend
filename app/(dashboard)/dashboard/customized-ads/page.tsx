'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoSelectionContent } from './photo-selection';
import { ArchetypeSelectionContent } from './archetype-selection';
import { FormatSelectionContent } from './format-selection';
import styles from './page.module.css';

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
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

export function NavigationButtons({ 
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

export default function CustomizedAdsPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step configuration - can be extended for multiple steps
  const stepConfig = {
    1: {
      title: "Choose product photos",
      description: "We will include them in your ad.",
      content: <PhotoSelectionContent />
    },
    2: {
      title: "Choose ad archetype",
      description: "Select the soul of your ad.",
      content: <ArchetypeSelectionContent />
    },
    3: {
      title: "Select format",
      description: "Select the format for where you'll publish.",
      content: <FormatSelectionContent />
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

  const handleNext = () => {
    const maxSteps = Object.keys(stepConfig).length;
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // TODO: Handle final step (submit or navigate to results)
      console.log('Final step - submit');
    }
  };

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

