"use client";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  contentClassName?: string;
};

export function Dialog({ open, onClose, children, contentClassName }: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const defaultClassName = "bg-white rounded-2xl shadow-xl p-8 w-[90%] max-w-md text-center animate-fadeIn";
  const className = contentClassName || defaultClassName;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Render dialog at document root level using portal
  if (typeof window !== "undefined") {
    return createPortal(dialogContent, document.body);
  }

  return null;
}
