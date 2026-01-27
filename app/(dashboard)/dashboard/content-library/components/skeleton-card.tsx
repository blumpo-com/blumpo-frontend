import Trash from "@/assets/icons/Trash.svg";
import { Download } from "lucide-react";
import styles from "../page.module.css";

export function SkeletonCard() {
  return (
    <div className={styles.imageCard}>
      <div className={styles.imageWrapper}>
        <div className="skeletonImage" />
      </div>
      <div className={styles.actionBar}>
        <div
          className={styles.actionButton}
          style={{ opacity: 0.5, pointerEvents: "none" }}
        >
          <Trash className={styles.tabIcon} size={16} />
        </div>
        <div
          className={styles.actionButton}
          style={{ opacity: 0.5, pointerEvents: "none" }}
        >
          <Download className={styles.tabIcon} size={16} />
        </div>
      </div>
    </div>
  );
}
