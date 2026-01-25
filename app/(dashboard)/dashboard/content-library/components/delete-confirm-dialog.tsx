"use client";

import Image from "next/image";
import { Dialog } from "@/components/ui/dialog";
import styles from "../page.module.css";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className={styles.deleteDialogContent}>
        <p className={styles.deleteDialogText}>
          Are you sure you want to delete the ad?
        </p>

        <div className={styles.deleteDialogImage}>
          <Image
            src="/images/blumpo/trash-blumpo.png"
            alt="Trash Blumpo"
            width={110}
            height={110}
            className={styles.deleteDialogImageImg}
            unoptimized
          />
        </div>

        <div className={styles.deleteDialogButtons}>
          <button
            onClick={handleConfirm}
            className={styles.deleteDialogButtonConfirm}
          >
            Yes, delete
          </button>
          <button onClick={onClose} className={styles.deleteDialogButtonCancel}>
            Cancel
          </button>
        </div>
      </div>
    </Dialog>
  );
}
