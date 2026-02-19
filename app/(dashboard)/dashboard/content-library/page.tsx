"use client";

import React, { useEffect, useState } from "react";
import { useBrand } from "@/lib/contexts/brand-context";
import { useUser } from "@/lib/contexts/user-context";
import { useRouter, useSearchParams } from "next/navigation";
import TrashRestore from "@/assets/icons/Trash-restore.svg";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, X } from "lucide-react";
import Image from "next/image";
import { CreateNewCard } from "./components/create-new-card";
import { ImageCard } from "./components/image-card";
import { SkeletonCard } from "./components/skeleton-card";
import { WarningBox } from "./components/warning-box";
import { DeleteConfirmDialog } from "./components/delete-confirm-dialog";
import { ErrorDialog } from "@/components/error-dialog";
import { AdImage, archetypes, ContentLibraryResponse, formats, getArchetypeName } from "./types";
import styles from "./page.module.css";

interface FilterTabProps {
  label: string;
  iconSrc: string;
  iconAlt: string;
  value: string;
  options: Array<{ code: string; name: string }>;
  onSelect: (code: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MultiSelectFilterTabProps {
  label: string;
  iconSrc: string;
  iconAlt: string;
  selectedValues: string[];
  options: Array<{ code: string; name: string }>;
  onToggle: (code: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function MultiSelectFilterTab({
  label,
  iconSrc,
  iconAlt,
  selectedValues,
  options,
  onToggle,
  isOpen,
  onOpenChange,
}: MultiSelectFilterTabProps) {
  const isAllSelected = selectedValues.includes("all");
  const otherOptions = options.filter((opt) => opt.code !== "all");

  const getDisplayValue = () => {
    if (isAllSelected || selectedValues.length === 0) {
      return "All";
    }
    const selectedNames = selectedValues
      .map((code) => options.find((opt) => opt.code === code)?.name)
      .filter(Boolean)
      .join(", ");
    return selectedNames || "All";
  };

  const handleToggle = (code: string) => {
    onToggle(code);
  };

  return (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{label}</label>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger className={styles.filterInput}>
          <Image src={iconSrc} alt={iconAlt} className={styles.tabIcon} width={20} height={20} />
          <span className={styles.filterValue}>{getDisplayValue()}</span>
          <ChevronDown className={styles.chevronIcon} size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={styles.dropdownContent}>
          {options.map((option) => {
            const isChecked = isAllSelected
              ? option.code === "all"
              : selectedValues.includes(option.code);
            return (
              <DropdownMenuCheckboxItem
                key={option.code}
                checked={isChecked}
                onCheckedChange={() => handleToggle(option.code)}
                className={styles.dropdownItem}
              >
                <span className={styles.dropdownItemText}>{option.name}</span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface UnsavedButtonTabProps {
  isActive: boolean;
  onClick: () => void;
  jobDisplayName?: string | null;
  onRemoveJobFilter?: () => void;
}

function UnsavedButtonTab({ isActive, onClick, jobDisplayName, onRemoveJobFilter }: UnsavedButtonTabProps) {
  return (
    <div className={styles.unsavedButtonContainer}>
      <button
        className={`${styles.unsavedButton} ${isActive ? styles.unsavedButtonActive : ""
          }`}
        onClick={onClick}
      >
        <TrashRestore className={styles.tabIcon} alt="Trash Restore" />
        Unsaved ads
      </button>
      {jobDisplayName && (
        <div className={styles.jobFilterBadge}>
          <span className={styles.jobFilterText}>{jobDisplayName}</span>
          {onRemoveJobFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveJobFilter();
              }}
              className={styles.jobFilterRemove}
              aria-label="Remove job filter"
            >
              <X className={styles.jobFilterRemoveIcon} size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContentLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get('job_id');
  const { currentBrand, isInitialized } = useBrand();
  const { user } = useUser();
  const planCode = user?.tokenAccount?.planCode ?? "FREE";
  const [allImages, setAllImages] = useState<AdImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [isArchetypeOpen, setIsArchetypeOpen] = useState(false);
  const [isFormatOpen, setIsFormatOpen] = useState(false);
  const [pendingImageIds, setPendingImageIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{
    imageId: string;
    jobId: string | null;
  } | null>(null);
  const [restoreUpgradeDialog, setRestoreUpgradeDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: "", message: "" });
  const [columnsCount, setColumnsCount] = useState(4);
  const [jobDisplayName, setJobDisplayName] = useState<string | null>(null);

  // Fetch all images once on mount (including deleted for unsaved filter)
  const fetchImages = async () => {
    if (!isInitialized) return;

    setIsLoading(true);
    setError(null);

    try {
      const brandId = currentBrand?.id || null;
      const params = new URLSearchParams();
      if (brandId) {
        params.append("brandId", brandId);
      }
      if (jobIdFromUrl) {
        params.append("jobId", jobIdFromUrl);
      }
      // Always fetch deleted images too, so we can filter client-side
      params.append("includeDeleted", "true");

      const response = await fetch(`/api/content-library?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data: ContentLibraryResponse = await response.json();
      setAllImages(data.images);
    } catch (err) {
      console.error("Error fetching content library:", err);
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch job details when job_id is in URL
  useEffect(() => {
    if (jobIdFromUrl) {
      const fetchJobDetails = async () => {
        try {
          const response = await fetch(`/api/generation-job?jobId=${jobIdFromUrl}`);
          if (response.ok) {
            const job = await response.json();
            let displayName = 'Generation job';
            
            if (job.autoGenerated) {
              displayName = 'Quick ads';
            } 
            else if (job.archetypeMode === 'random') {
              displayName = 'Random ads';
            }
            else if (job.archetypeCode) {
              // Use getArchetypeName from types to get display name
              displayName = getArchetypeName(job.archetypeCode as any);
            }
            
            setJobDisplayName(displayName);
          }
        } catch (err) {
          console.error('Error fetching job details:', err);
        }
      };
      
      fetchJobDetails();
    } else {
      setJobDisplayName(null);
    }
  }, [jobIdFromUrl]);

  useEffect(() => {
    fetchImages();
  }, [currentBrand?.id, isInitialized, jobIdFromUrl]);

  // Client-side filtering using useMemo
  const images = React.useMemo(() => {
    let filtered = [...allImages];

    // Filter by jobId if present in URL
    if (jobIdFromUrl) {
      filtered = filtered.filter((img) => img.job?.id === jobIdFromUrl);
    }

    // Filter by archetype(s)
    if (selectedArchetypes.length > 0 && !selectedArchetypes.includes("all")) {
      filtered = filtered.filter(
        (img) =>
          img.workflow?.archetypeCode &&
          selectedArchetypes.includes(img.workflow.archetypeCode)
      );
    }

    // Filter by format(s)
    if (selectedFormats.length > 0 && !selectedFormats.includes("all")) {
      filtered = filtered.filter((img) => selectedFormats.includes(img.format));
    }

    // Filter unsaved ads (images with isDeleted = true)
    if (showUnsaved) {
      filtered = filtered.filter((img) => img.isDeleted === true);
    } else {
      // If not filtering unsaved, exclude deleted images
      filtered = filtered.filter((img) => !img.isDeleted);
    }

    return filtered;
  }, [allImages, selectedArchetypes, selectedFormats, showUnsaved, jobIdFromUrl]);

  const handleDownload = async (image: AdImage) => {
    try {
      const response = await fetch(image.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${image.title || "ad-image"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      // log download event to analytics
      fetch("/api/ad-actions", {
        method: "POST",
        body: JSON.stringify({
          jobId: image.job?.id,
          downloadedIds: [image.id],
        }),
      });
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard");
  };

  const handleDeleteClick = (
    imageId: string,
    jobId: string | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setImageToDelete({ imageId, jobId });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    const { imageId, jobId } = imageToDelete;

    if (!jobId) {
      console.error("No jobId found for image");
      setImageToDelete(null);
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setPendingImageIds((prev) =>
        prev.includes(imageId) ? prev : [...prev, imageId]
      );
      const response = await fetch("/api/ad-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          deletedIds: [imageId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete ad");
      }

      // Update local state instead of refetching
      setAllImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, isDeleted: true } : img
        )
      );
    } catch (err) {
      console.error("Error deleting ad:", err);
    } finally {
      setPendingImageIds((prev) => prev.filter((id) => id !== imageId));
      setImageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleRestore = async (
    imageId: string,
    jobId: string | null,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!jobId) {
      console.error("No jobId found for image");
      return;
    }

    if (planCode === "FREE") {
      setRestoreUpgradeDialog({
        open: true,
        title: "Restore Not Available",
        message:
          "Restoring ads is available on paid plans. Upgrade your plan to restore unsaved ads to your content library.",
      });
      return;
    }

    try {
      setPendingImageIds((prev) =>
        prev.includes(imageId) ? prev : [...prev, imageId]
      );
      const response = await fetch("/api/ad-actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          restoredIds: [imageId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore ad");
      }

      // Update local state instead of refetching
      setAllImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, isDeleted: false } : img
        )
      );
    } catch (err) {
      console.error("Error restoring ad:", err);
    } finally {
      setPendingImageIds((prev) => prev.filter((id) => id !== imageId));
    }
  };

  const handleArchetypeToggle = (code: string) => {
    setSelectedArchetypes((prev) => {
      if (code === "all") {
        if (prev.includes("all")) {
          return [];
        } else {
          return ["all"];
        }
      } else {
        const withoutAll = prev.filter((c) => c !== "all");
        if (withoutAll.includes(code)) {
          return withoutAll.filter((c) => c !== code);
        } else {
          return [...withoutAll, code];
        }
      }
    });
  };

  const handleFormatToggle = (code: string) => {
    setSelectedFormats((prev) => {
      if (code === "all") {
        if (prev.includes("all")) {
          return [];
        } else {
          return ["all"];
        }
      } else {
        const withoutAll = prev.filter((c) => c !== "all");
        if (withoutAll.includes(code)) {
          return withoutAll.filter((c) => c !== code);
        } else {
          return [...withoutAll, code];
        }
      }
    });
  };

  // Determine number of columns based on screen width
  useEffect(() => {
    const updateColumnsCount = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setColumnsCount(1);
      } else if (width <= 768) {
        setColumnsCount(2);
      } else if (width <= 1024) {
        setColumnsCount(3);
      } else {
        setColumnsCount(4);
      }
    };

    updateColumnsCount();
    window.addEventListener("resize", updateColumnsCount);
    return () => window.removeEventListener("resize", updateColumnsCount);
  }, []);

  // Distribute cards into columns for masonry layout
  const distributeCardsIntoColumns = (
    items: React.ReactNode[],
    isCreateCardFirst: boolean = false
  ) => {
    const columns: React.ReactNode[][] = Array.from({ length: columnsCount }, () => []);

    items.forEach((item, index) => {
      // First item goes to first column if it's create card
      if (isCreateCardFirst && index === 0) {
        columns[0].push(item);
        return;
      }

      // For other items, find the column with fewest items
      const shortestColumnIndex = columns.reduce(
        (minIndex, column, currentIndex) =>
          column.length < columns[minIndex].length ? currentIndex : minIndex,
        0
      );
      columns[shortestColumnIndex].push(item);
    });

    return columns;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`header-gradient-dashboard`}>Content library</h1>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <MultiSelectFilterTab
          label="Archetype"
          iconSrc="/assets/icons/Megaphone.svg"
          iconAlt="Archetype"
          selectedValues={selectedArchetypes}
          options={archetypes}
          onToggle={handleArchetypeToggle}
          isOpen={isArchetypeOpen}
          onOpenChange={setIsArchetypeOpen}
        />

        <MultiSelectFilterTab
          label="Format"
          iconSrc="/assets/icons/Ruler.svg"
          iconAlt="Format"
          selectedValues={selectedFormats}
          options={formats}
          onToggle={handleFormatToggle}
          isOpen={isFormatOpen}
          onOpenChange={setIsFormatOpen}
        />

        <UnsavedButtonTab
          isActive={showUnsaved}
          onClick={() => setShowUnsaved(!showUnsaved)}
          jobDisplayName={jobDisplayName}
          onRemoveJobFilter={() => {
            router.replace('/dashboard/content-library');
          }}
        />
      </div>

      {/* Warning message for unsaved ads */}
      {showUnsaved && <WarningBox />}

      {/* Content */}
      {isLoading ? (
        <div className={styles.gridWrapper}>
          <div className={styles.grid}>
            <CreateNewCard onClick={handleCreateNew} />
            {[...Array(10)].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>{error}</p>
        </div>
      ) : (
        <>
          {images.length === 0 ? (
            <div className={styles.emptyState}>
              <Image
                src="/images/blumpo/confused-blumpo.png"
                alt="Confused Blumpo"
                width={300}
                height={300}
                className={styles.emptyStateImage}
                unoptimized
              />
              <p className={styles.emptyStateText}>
                No ads found.{" "}
                {showUnsaved
                  ? "No unsaved ads."
                  : "Create your first ad to see it here!"}
              </p>
            </div>
          ) : (
            /* Grid */
            <div className={styles.gridWrapper}>
              <div className={styles.grid}>
                {distributeCardsIntoColumns(
                  [
                    ...(!showUnsaved
                      ? [
                        <CreateNewCard
                          key="create-new"
                          onClick={handleCreateNew}
                        />,
                      ]
                      : []),
                    ...images.map((image) => (
                      <ImageCard
                        key={image.id}
                        image={image}
                        showUnsaved={showUnsaved}
                        isActionLoading={pendingImageIds.includes(image.id)}
                        onDelete={handleDeleteClick}
                        onRestore={handleRestore}
                        onDownload={handleDownload}
                      />
                    )),
                  ],
                  !showUnsaved
                ).map((column, columnIndex) => (
                  <div key={columnIndex} className={styles.gridColumn}>
                    {column}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setImageToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Restore upgrade dialog - shown when FREE plan user tries to restore */}
      <ErrorDialog
        open={restoreUpgradeDialog.open}
        onClose={() =>
          setRestoreUpgradeDialog((prev) => ({ ...prev, open: false }))
        }
        title={restoreUpgradeDialog.title}
        message={restoreUpgradeDialog.message}
        primaryButton={{
          label: 'Upgrade Plan',
          onClick: () => router.push("/dashboard/your-credits"),
          variant: 'cta',
        }}
        secondaryButton={{
          label: 'Close',
          onClick: () => setRestoreUpgradeDialog((prev) => ({ ...prev, open: false })),
          variant: 'outline',
        }}
      />
    </div>
  );
}
