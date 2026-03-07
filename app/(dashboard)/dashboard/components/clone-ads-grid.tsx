"use client";

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import type { CloneAdsResponse } from "@/lib/types/clone-ads";
import { CloneAdCard } from "./clone-ad-card";
import styles from "./clone-ads-grid.module.css";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<CloneAdsResponse>);

function SkeletonCard() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImageWrapper}>
        <div className="skeletonImage" />
      </div>
    </div>
  );
}

interface CloneAdsGridProps {
  onCloneAdClick?: (workflowId: string) => void;
}

export function CloneAdsGrid({ onCloneAdClick }: CloneAdsGridProps = {}) {
  const { data, error, isLoading } = useSWR<CloneAdsResponse>("/api/clone-ads", fetcher);
  const [columnsCount, setColumnsCount] = useState(4);

  useEffect(() => {
    const updateColumnsCount = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setColumnsCount(1);
      } else if (width <= 768) {
        setColumnsCount(2);
      } else if (width <= 1024) {
        setColumnsCount(3);
      } else {
        setColumnsCount(4);
      }
    };

    updateColumnsCount();
    window.addEventListener("resize", updateColumnsCount);
    return () => window.removeEventListener("resize", updateColumnsCount);
  }, []);

  const distributeCardsIntoColumns = (items: React.ReactNode[]) => {
    const columns: React.ReactNode[][] = Array.from({ length: columnsCount }, () => []);

    items.forEach((item) => {
      const shortestColumnIndex = columns.reduce(
        (minIndex, column, currentIndex) =>
          column.length < columns[minIndex].length ? currentIndex : minIndex,
        0
      );
      columns[shortestColumnIndex].push(item);
    });

    return columns;
  };

  if (error) {
    return (
      <div className={styles.gridWrapper}>
        <p className={styles.emptyMessage}>Failed to load template ads.</p>
      </div>
    );
  }

  if (isLoading) {
    const skeletonCount = Math.max(columnsCount * 2, 8);
    const skeletons = Array.from({ length: skeletonCount }, (_, i) => (
      <SkeletonCard key={`skeleton-${i}`} />
    ));
    const columns = distributeCardsIntoColumns(skeletons);

    return (
      <div className={styles.gridWrapper}>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))` }}>
          {columns.map((column, i) => (
            <div key={i} className={styles.gridColumn}>
              {column}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const clones = data?.clones ?? [];
  if (clones.length === 0) {
    return (
      <div className={styles.gridWrapper}>
        <p className={styles.emptyMessage}>No template ads available.</p>
      </div>
    );
  }

  const cards = clones.map((clone) => (
    <CloneAdCard key={clone.id} clone={clone} onCloneAdClick={onCloneAdClick} />
  ));
  const columns = distributeCardsIntoColumns(cards);

  return (
    <div className={styles.gridWrapper}>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))` }}>
        {columns.map((column, i) => (
          <div key={i} className={styles.gridColumn}>
            {column}
          </div>
        ))}
      </div>
    </div>
  );
}
