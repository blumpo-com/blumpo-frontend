import Image from "next/image";
import Trash from "@/assets/icons/Trash.svg";
import TrashRestore from "@/assets/icons/Trash-restore.svg";
import { Download } from "lucide-react";
import { AdImage, ArchetypeCode, getArchetypeName } from "../types";
import styles from "../page.module.css";

interface ImageCardProps {
  image: AdImage;
  showUnsaved: boolean;
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
  onDelete,
  onRestore,
  onDownload,
}: ImageCardProps) {
  return (
    <div
      className={`${styles.imageCard} ${
        image.format === "16:9" ? styles.format16x9 : ""
      }`}
    >
      <div className={styles.imageWrapper}>
        <Image
          src={image.publicUrl}
          alt={image.title || "Ad image"}
          width={image.width}
          height={image.height}
          className={styles.image}
          unoptimized
        />
        {image.workflow?.archetypeCode && (
          <div className={styles.brandOverlay}>
            <span className={styles.brandName}>{getArchetypeName(image.workflow.archetypeCode as ArchetypeCode)}</span>
          </div>
        )}
      </div>
      <div className={styles.actionBar}>
        <button
          className={styles.actionButton}
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
