import { AlertTriangle } from "lucide-react";
import styles from "../page.module.css";
import { CONTENT_LIBRARY_DELETE_GRACE_DAYS } from "../types";

export function WarningBox() {
  return (
    <div className={styles.warningBox}>
      <AlertTriangle className={styles.warningIcon} size={20} />
      <p className={styles.warningText}>
        These ads have not been saved. They will be automatically deleted after 
        {" " + CONTENT_LIBRARY_DELETE_GRACE_DAYS + " "} days.
        Download or save them to your library to keep them permanently.
      </p>
    </div>
  );
}
