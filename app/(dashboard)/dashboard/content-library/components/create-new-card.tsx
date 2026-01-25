import { Plus } from "lucide-react";
import styles from "../page.module.css";
import AddFilled from "@/assets/icons/Add-filled.svg";

interface CreateNewCardProps {
  onClick: () => void;
}

export function CreateNewCard({ onClick }: CreateNewCardProps) {
  return (
    <div className={styles.createCardWrapper}>
      <div className={styles.createCardContent}>
          <div className={styles.createCardIcon}>
            <AddFilled size={32} />
          </div>
          <p className={styles.createCardText}>Tap to create new</p>
        </div>
      <div className={styles.createCard} onClick={onClick}>
        
      </div>
      <div className={styles.actionBar} style={{ borderTop: "none", borderRadius: "6px" }} />
    </div>
  );
}
