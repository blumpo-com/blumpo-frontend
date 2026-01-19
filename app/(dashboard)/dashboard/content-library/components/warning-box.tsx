import { AlertTriangle } from "lucide-react";
import styles from "../page.module.css";

export function WarningBox() {
  return (
    <div className={styles.warningBox}>
      <AlertTriangle className={styles.warningIcon} size={20} />
      <p className={styles.warningText}>
        These ads have not been saved. They will be automatically deleted after
        30 days. Download or save them to your library to keep them permanently.
      </p>
    </div>
  );
}
