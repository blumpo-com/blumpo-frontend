'use client';

import styles from './insight-selection.module.css';

interface InsightSelectionContentProps {
  headlines: string[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedInsights: string[];
  onSelectedInsightsChange: (insights: string[]) => void;
}

interface HeadlineCardProps {
  headline: string;
  isSelected: boolean;
  onClick: () => void;
}

function HeadlineCard({ headline, isSelected, onClick }: HeadlineCardProps) {
  return (
    <button
      className={`${styles.headlineCard} ${isSelected ? styles.headlineCardSelected : ''}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.headlineText}>{headline}</span>
      {isSelected && (
        <svg
          className={styles.checkIcon}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M16.6667 5L7.50004 14.1667L3.33337 10"
            stroke="#00bfa6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export function InsightSelectionContent({
  headlines,
  isLoading,
  error,
  onRetry,
  selectedInsights,
  onSelectedInsightsChange,
}: InsightSelectionContentProps) {

  const handleHeadlineToggle = (headline: string) => {
    if (selectedInsights.includes(headline)) {
      onSelectedInsightsChange(selectedInsights.filter(h => h !== headline));
    } else {
      onSelectedInsightsChange([...selectedInsights, headline]);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading headlines...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
        <button
          className={styles.retryButton}
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (headlines.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>No headlines available for this archetype.</p>
      </div>
    );
  }

  return (
    <div className={styles.insightSelectionContent}>
      <div className={styles.headlinesGrid}>
        {headlines.map((headline, index) => (
          <HeadlineCard
            key={index}
            headline={headline}
            isSelected={selectedInsights.includes(headline)}
            onClick={() => handleHeadlineToggle(headline)}
          />
        ))}
      </div>
    </div>
  );
}
