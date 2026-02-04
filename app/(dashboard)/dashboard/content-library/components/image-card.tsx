import Image from "next/image";
import Trash from "@/assets/icons/Trash.svg";
import TrashRestore from "@/assets/icons/Trash-restore.svg";
import { Download } from "lucide-react";
import { AdImage, ArchetypeCode, getArchetypeName } from "../types";
import styles from "../page.module.css";

interface ImageCardProps {
  image: AdImage;
  showUnsaved: boolean;
  isActionLoading: boolean;
  onDelete: (
    imageId: string,
    jobId: string | null,
    e: React.MouseEvent
  ) => void | Promise<void>;
  onRestore: (
    imageId: string,
    jobId: string | null,
    e: React.MouseEvent
  ) => void | Promise<void>;
  onDownload: (image: AdImage) => void | Promise<void>;
}

export function ImageCard({
  image,
  showUnsaved,
  isActionLoading,
  onDelete,
  onRestore,
  onDownload,
}: ImageCardProps) {
  const remainingDeleteDays = (() => {
    if (!showUnsaved || !image.deleteAt) return null;
    const deleteAtTime = new Date(image.deleteAt).getTime();
    if (Number.isNaN(deleteAtTime)) return null;
    const diffMs = deleteAtTime - Date.now();
    const remaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(remaining, 0);
  })();

  return (
    <div
      className={`${styles.imageCard} ${image.format === "9:16" ? styles.format9x16 : ""
        }`}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={image.publicUrl}
          alt={image.title || "Ad image"}
          width={image.width}
          height={image.height}
          className={styles.image}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 400px"
        />
        {image.workflow?.archetypeCode && (
          <div className={styles.brandOverlay}>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>
                {getArchetypeName(image.workflow.archetypeCode as ArchetypeCode)}
              </span>
              {remainingDeleteDays !== null && (
                <span className={styles.deleteCountdown}>
                  {remainingDeleteDays} days left
                </span>
              )}
            </div>
          </div>
        )}
        {isActionLoading && (
          <div className="photoLoadingOverlay">
            <div className="photoLoadingSpinner" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className={styles.actionBar}>
        <button
          className={styles.actionButton}
          disabled={isActionLoading}
          onClick={(e) =>
            showUnsaved
              ? onRestore(image.id, image.job?.id || null, e)
              : onDelete(image.id, image.job?.id || null, e)
          }
          title={showUnsaved ? "Restore ad" : "Delete ad"}
        >
          {showUnsaved ? (
            <TrashRestore className={styles.tabIcon} size={16} />
          ) : (
            <Trash className={styles.tabIcon} size={16} />
          )}
        </button>
        <button
          className={styles.actionButton}
          disabled={isActionLoading}
          onClick={(e) => {
            e.stopPropagation();
            onDownload(image);
          }}
          title="Download"
        >
          <Download className={styles.tabIcon} size={16} />
        </button>
      </div>
    </div>
  );
}
