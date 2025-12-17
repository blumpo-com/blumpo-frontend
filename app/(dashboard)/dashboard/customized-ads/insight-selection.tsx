'use client';

import { useState } from 'react';
import styles from './insight-selection.module.css';

interface InsightSelectionContentProps {
  selectedArchetype: string;
  headlines: string[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  selectedInsights: string[];
  onSelectedInsightsChange: (insights: string[]) => void;
}

// Archetype-specific titles
const getArchetypeTitle = (archetype: string): string => {
  const titles: Record<string, string> = {
    problem_solution: 'Customer pain points',
    testimonial: 'Product review',
    competitor_comparison: 'Competitors',
    promotion_offer: 'Promotional offers',
    value_proposition: 'Highlighted value insight (up to 4)',
    random: 'Headlines',
  };
  return titles[archetype] || titles.problem_solution;
};

interface HeadlineCardProps {
  headline: string;
  isSelected: boolean;
  onClick: () => void;
}

function HeadlineCard({ headline, isSelected, onClick }: HeadlineCardProps) {
  // Parse headline to extract prefix and quote if it follows the pattern
  const parseHeadline = (text: string) => {
    // Check if headline follows pattern like "Pain - \"quote\"" or "Pain - quote"
    const matchWithQuotes = text.match(/^([^-]+)\s*-\s*"(.+)"$/);
    if (matchWithQuotes) {
      return {
        prefix: matchWithQuotes[1].trim(),
        quote: matchWithQuotes[2],
        hasQuotes: true
      };
    }
    // Check if headline follows pattern like "Pain - quote" (without quotes)
    const matchWithoutQuotes = text.match(/^([^-]+)\s*-\s*(.+)$/);
    if (matchWithoutQuotes) {
      return {
        prefix: matchWithoutQuotes[1].trim(),
        quote: matchWithoutQuotes[2].trim(),
        hasQuotes: false
      };
    }
    // If no pattern match, return as is (no prefix, just the text)
    return {
      prefix: '',
      quote: text,
      hasQuotes: false
    };
  };

  const { prefix, quote, hasQuotes } = parseHeadline(headline);

  return (
    <button
      className={`${styles.headlineCard} ${isSelected ? styles.headlineCardSelected : ''}`}
      onClick={onClick}
      type="button"
    >
      {/* Circular indicator on the left */}
      <div className={styles.circleIndicator}>
        {isSelected ? (
          <div className={styles.checkIconContainer}>
            <svg
              className={styles.checkIcon}
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M11.6667 3.5L5.25004 9.91667L2.33337 7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div className={styles.circleOutline}></div>
        )}
      </div>
      <span className={styles.headlineText}>
        {prefix ? (
          <>
            <span className={styles.headlinePrefix}>{prefix} - </span>
            <span className={styles.headlineQuote}>
              {hasQuotes ? `"${quote}"` : quote}
            </span>
          </>
        ) : (
          <span>{quote}</span>
        )}
      </span>
    </button>
  );
}

export function InsightSelectionContent({
  selectedArchetype,
  headlines,
  isLoading,
  error,
  onRetry,
  selectedInsights,
  onSelectedInsightsChange,
}: InsightSelectionContentProps) {
  const [manualInput, setManualInput] = useState('');

  const handleHeadlineToggle = (headline: string) => {
    if (selectedInsights.includes(headline)) {
      onSelectedInsightsChange(selectedInsights.filter(h => h !== headline));
    } else {
      onSelectedInsightsChange([...selectedInsights, headline]);
    }
  };

  const handleManualInputAdd = () => {
    const trimmedInput = manualInput.trim();
    
    // Filter out any previous manual inputs (those not in headlines array)
    const headlineInsights = selectedInsights.filter(insight => 
      headlines.includes(insight)
    );

    // If there's text, add it (replacing previous manual inputs)
    if (trimmedInput) {
      // Add current manual input if it's not already in the list
      if (!headlineInsights.includes(trimmedInput)) {
        onSelectedInsightsChange([...headlineInsights, trimmedInput]);
      } else {
        // If it's already there, just keep the headline insights (remove duplicates)
        onSelectedInsightsChange(headlineInsights);
      }
    } else {
      // If input is empty, remove all previous manual inputs
      onSelectedInsightsChange(headlineInsights);
    }
  };

  const handleManualInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualInputAdd();
    }
  };

  const handleManualInputBlur = () => {
    handleManualInputAdd();
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

  return (
    <div className={styles.insightSelectionWrapper}>
      <div className={styles.insightSelectionContent}>
        {/* Title at top center */}
        <h2 className={styles.sectionTitle}>
          {getArchetypeTitle(selectedArchetype)}
        </h2>

        {/* Headlines Grid */}
        {headlines.length > 0 ? (
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
        ) : (
          <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No headlines available for this archetype.</p>
          </div>
        )}
      </div>

      {/* Manual Input at bottom */}
      <div className={styles.manualInputContainer}>
        <label className={styles.manualInputLabel}>Manual input</label>
        <input
          type="text"
          className={styles.manualInput}
          placeholder="Enter you custom pain points"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyPress={handleManualInputKeyPress}
          onBlur={handleManualInputBlur}
        />
      </div>
    </div>
  );
}
