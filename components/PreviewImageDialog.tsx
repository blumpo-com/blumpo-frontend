"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Download } from "lucide-react";
import styles from "./PreviewImageDialog.module.css";

export interface PreviewImageDialogImage {
  publicUrl: string;
  title?: string | null;
}

interface PreviewImageDialogProps<T extends PreviewImageDialogImage = PreviewImageDialogImage> {
  /** Image to display. When null, the dialog is not rendered. */
  image: T | null;
  onClose: () => void;
  /** Called when the user clicks the download button. If not provided, the download button is hidden. */
  onDownload?: (image: T) => void;
}

const CLOSE_DELAY_MS = 220;

export function PreviewImageDialog<T extends PreviewImageDialogImage>({
  image,
  onClose,
  onDownload,
}: PreviewImageDialogProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (image) {
      const t = requestAnimationFrame(() => setIsOpen(true));
      return () => cancelAnimationFrame(t);
    } else {
      setIsOpen(false);
    }
  }, [image]);

  useEffect(() => {
    if (!image) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [image]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, CLOSE_DELAY_MS);
  };

  const handleSaveClick = () => {
    if (image != null && onDownload) {
      onDownload(image);
      handleClose();
    }
  };

  if (image === null || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div
        className={styles.content}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className={styles.closeButton}
          aria-label="Close"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className={styles.imageWrap}>
          <img
            src={image.publicUrl}
            alt={image.title ?? "Ad image"}
            className={styles.image}
          />
        </div>
        {onDownload && (
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveClick}
            title="Save image"
          >
            <Download size={26} />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
