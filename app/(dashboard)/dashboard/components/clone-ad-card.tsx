"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import type { CloneAd } from "@/lib/types/clone-ads";
import styles from "./clone-ad-card.module.css";

interface CloneAdCardProps {
  clone: CloneAd;
}

export function CloneAdCard({ clone }: CloneAdCardProps) {
  const router = useRouter();
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  const is9x16 = clone.format === "9:16";
  const cardClass = is9x16 ? `${styles.imageCard} ${styles.format9x16}` : styles.imageCard;

  const handleClick = () => {
    router.push(`/dashboard/customized-ads?workflowId=${clone.workflowId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
    }
  };

  const wrapperStyle =
    dimensions != null
      ? { aspectRatio: `${dimensions.w} / ${dimensions.h}` }
      : undefined;

  return (
    <article
      className={cardClass}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="Clone this template ad"
    >
      <div className={styles.imageWrapper} style={wrapperStyle}>
        {clone.storageUrl ? (
          <Image
            src={clone.storageUrl}
            alt={`Template ad ${clone.archetypeCode} ${clone.variantKey}`}
            width={dimensions?.w ?? 400}
            height={dimensions?.h ?? (is9x16 ? 711 : 400)}
            className={styles.image}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className={styles.placeholder}>No preview</div>
        )}
        <div className={styles.hoverOverlay} aria-hidden>
          <span className={styles.cloneButton}>
            Clone ad
            <Copy className={styles.cloneIcon} size={20} />
          </span>
        </div>
      </div>
    </article>
  );
}
