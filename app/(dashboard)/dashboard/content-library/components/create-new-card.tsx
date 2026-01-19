import { Plus } from "lucide-react";
import styles from "../page.module.css";
import AddFilled from "@/assets/icons/Add-filled.svg";

interface CreateNewCardProps {
  onClick: () => void;
}

export function CreateNewCard({ onClick }: CreateNewCardProps) {
  return (
    <div className={styles.createCard} onClick={onClick}>
      <div className={styles.createCardIcon}>
        <AddFilled size={32} />
      </div>
      <p className={styles.createCardText}>Tap to create new</p>
    </div>
  );
}
