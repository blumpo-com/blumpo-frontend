'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './meme-selection.module.css';

const MEME_PLACEHOLDER = '/images/dashboard/no-image.png';

/** Format variant_key for display: "meme_1" → "Meme 1", "meme_20" → "Meme 20" */
function formatMemeDisplayName(variantKey: string): string {
  const match = variantKey.match(/^meme_(\d+)$/i);
  if (match) {
    return `Meme ${match[1]}`;
  }
  return variantKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Sort by numeric part of variant_key (meme_1, meme_2, …, meme_10, …) */
function sortMemeWorkflowsByNumber(items: MemeWorkflowItem[]): MemeWorkflowItem[] {
  return [...items].sort((a, b) => {
    const numA = a.variantKey.match(/^meme_(\d+)$/i)?.[1];
    const numB = b.variantKey.match(/^meme_(\d+)$/i)?.[1];
    if (numA != null && numB != null) {
      return Number(numA) - Number(numB);
    }
    return (a.variantKey ?? '').localeCompare(b.variantKey ?? '');
  });
}

export interface MemeWorkflowItem {
  workflowId: string;
  variantKey: string;
  storageUrl: string | null;
}

interface MemeCardProps {
  workflowId: string;
  title: string;
  image: string;
  isSelected: boolean;
  onClick: () => void;
}

function MemeCard({ workflowId, title, image, isSelected, onClick }: MemeCardProps) {
  const [imgSrc, setImgSrc] = useState(image);

  // Reset when image URL changes (e.g. different meme)
  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  const handleError = () => {
    if (imgSrc !== MEME_PLACEHOLDER) {
      setImgSrc(MEME_PLACEHOLDER);
    }
  };

  return (
    <button
      className={`${styles.memeCard} ${isSelected ? styles.memeCardSelected : styles.gradientBorder}`}
      onClick={onClick}
      type="button"
    >
      <h3 className={styles.memeCardTitle}>{title}</h3>
      <div className={styles.memeCardImageWrapper}>
        <img
          src={imgSrc}
          alt={title}
          className={styles.memeCardImage}
          referrerPolicy="no-referrer"
          onError={handleError}
        />
      </div>
    </button>
  );
}

export interface MemeSelectionContentProps {
  selectedMemeTypes: string[];
  onSelectedMemeTypesChange: (ids: string[]) => void;
}

const DEFAULT_SELECTION_COUNT = 3;
const MAX_SELECTION_COUNT = 5;

export function MemeSelectionContent({
  selectedMemeTypes,
  onSelectedMemeTypesChange,
}: MemeSelectionContentProps) {
  const [memeWorkflows, setMemeWorkflows] = useState<MemeWorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitializedSelectionRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchMemeWorkflows() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/meme-workflows');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load (${res.status})`);
        }
        const data = await res.json();
        if (!cancelled) {
          setMemeWorkflows(sortMemeWorkflowsByNumber(data.memeWorkflows ?? []));
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load meme types');
          setMemeWorkflows([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchMemeWorkflows();
    return () => { cancelled = true; };
  }, []);

  // On first load, pre-select first 3 memes when none selected
  useEffect(() => {
    if (
      memeWorkflows.length >= DEFAULT_SELECTION_COUNT &&
      selectedMemeTypes.length === 0 &&
      !hasInitializedSelectionRef.current
    ) {
      hasInitializedSelectionRef.current = true;
      const initialIds = memeWorkflows.slice(0, DEFAULT_SELECTION_COUNT).map((m) => m.workflowId);
      onSelectedMemeTypesChange(initialIds);
    }
  }, [memeWorkflows, selectedMemeTypes.length, onSelectedMemeTypesChange]);

  const handleToggle = (workflowId: string) => {
    if (selectedMemeTypes.includes(workflowId)) {
      onSelectedMemeTypesChange(selectedMemeTypes.filter((id) => id !== workflowId));
    } else if (selectedMemeTypes.length < MAX_SELECTION_COUNT) {
      onSelectedMemeTypesChange([...selectedMemeTypes, workflowId]);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading meme types...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (memeWorkflows.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyText}>No meme types available. Add ad clones for meme workflows to see them here.</p>
      </div>
    );
  }

  return (
    <div className={styles.memeSelectionWrapper}>
      <div className={styles.memeSelectionGrid}>
        {memeWorkflows.map((meme) => (
          <MemeCard
            key={meme.workflowId}
            workflowId={meme.workflowId}
            title={formatMemeDisplayName(meme.variantKey)}
            image={meme.storageUrl || MEME_PLACEHOLDER}
            isSelected={selectedMemeTypes.includes(meme.workflowId)}
            onClick={() => handleToggle(meme.workflowId)}
          />
        ))}
      </div>
      {selectedMemeTypes.length > 0 && (
        <p className={styles.memeSelectionHint}>
          {selectedMemeTypes.length < 3
            ? `Choose ${DEFAULT_SELECTION_COUNT - selectedMemeTypes.length} more (3–5 total)`
            : selectedMemeTypes.length > MAX_SELECTION_COUNT
              ? `Select at most ${MAX_SELECTION_COUNT} meme types`
              : `${selectedMemeTypes.length} selected`}
        </p>
      )}
    </div>
  );
}
