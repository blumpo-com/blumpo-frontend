'use client';

import { useEffect, useState } from 'react';
import { useBrand } from '@/lib/contexts/brand-context';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  Plus, 
  FileText, 
  Download,
} from 'lucide-react';
import styles from './page.module.css';

interface AdImage {
  id: string;
  title: string | null;
  publicUrl: string;
  width: number;
  height: number;
  format: string;
  createdAt: Date | string;
  brand: {
    id: string | null;
    name: string | null;
    websiteUrl: string | null;
  } | null;
  job: {
    id: string;
    status: string;
    archetypeCode: string | null;
    archetypeMode: string | null;
    createdAt: Date | string;
  } | null;
}

interface ContentLibraryResponse {
  images: AdImage[];
  total: number;
}

const archetypes = [
  { code: 'all', name: 'All' },
  { code: 'problem_solution', name: 'Problem-Solution' },
  { code: 'testimonial', name: 'Testimonial' },
  { code: 'competitor_comparison', name: 'Competitor Comparison' },
  { code: 'promotion_offer', name: 'Promotion (Offer)' },
  { code: 'value_proposition', name: 'Value Proposition' },
];

const formats = [
  { code: 'all', name: 'All' },
  { code: '1:1', name: '1:1' },
  { code: '16:9', name: '16:9' },
];

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

function FilterTab({ label, iconSrc, iconAlt, value, options, onSelect, isOpen, onOpenChange }: FilterTabProps) {
  const selectedOption = options.find(opt => opt.code === value);
  const displayValue = selectedOption?.name || 'All';

  return (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{label}</label>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger className={styles.filterInput}>
          <img src={iconSrc} alt={iconAlt} className={styles.tabIcon} />
          <span className={styles.filterValue}>{displayValue}</span>
          <ChevronDown className={styles.chevronIcon} size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={styles.dropdownContent}>
          {options.map((option) => (
            <DropdownMenuItem
              key={option.code}
              onClick={() => {
                onSelect(option.code);
                onOpenChange(false);
              }}
              className={styles.dropdownItem}
            >
              {option.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ArchetypeFilterTabProps {
  label: string;
  iconSrc: string;
  iconAlt: string;
  selectedValues: string[];
  options: Array<{ code: string; name: string }>;
  onToggle: (code: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function ArchetypeFilterTab({ label, iconSrc, iconAlt, selectedValues, options, onToggle, isOpen, onOpenChange }: ArchetypeFilterTabProps) {
  const isAllSelected = selectedValues.includes('all');
  const otherOptions = options.filter(opt => opt.code !== 'all');

  const getDisplayValue = () => {
    if (isAllSelected || selectedValues.length === 0) {
      return 'All';
    }
    const selectedNames = selectedValues
      .map(code => options.find(opt => opt.code === code)?.name)
      .filter(Boolean)
      .join(', ');
    return selectedNames || 'All';
  };

  const handleToggle = (code: string) => {
    onToggle(code);
  };

  return (
    <div className={styles.filterGroup}>
      <label className={styles.filterLabel}>{label}</label>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger className={styles.filterInput}>
          <img src={iconSrc} alt={iconAlt} className={styles.tabIcon} />
          <span className={styles.filterValue}>{getDisplayValue()}</span>
          <ChevronDown className={styles.chevronIcon} size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={styles.dropdownContent}>
          {options.map((option) => {
            // Jeśli "all" jest wybrane, pokazuj tylko "all" jako zaznaczone
            const isChecked = isAllSelected 
              ? option.code === 'all'
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
}

function UnsavedButtonTab({ isActive, onClick }: UnsavedButtonTabProps) {
  return (
    <button
      className={`${styles.unsavedButton} ${isActive ? styles.unsavedButtonActive : ''}`}
      onClick={onClick}
    >
      <img src="/assets/icons/Trash.svg" alt="Trash" className={styles.tabIcon} />
      Unsaved ads
    </button>
  ); 
}

export default function ContentLibraryPage() {
  const router = useRouter();
  const { currentBrand, isInitialized } = useBrand();
  const [images, setImages] = useState<AdImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchetypes, setSelectedArchetypes] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [isArchetypeOpen, setIsArchetypeOpen] = useState(false);
  const [isFormatOpen, setIsFormatOpen] = useState(false);

  useEffect(() => {
    async function fetchImages() {
      if (!isInitialized) return;

      setIsLoading(true);
      setError(null);

      try {
        const brandId = currentBrand?.id || null;
        const params = new URLSearchParams();
        if (brandId) {
          params.append('brandId', brandId);
        }
        // Jeśli "all" nie jest wybrane i są wybrane jakieś opcje, dodaj je do parametrów
        if (!selectedArchetypes.includes('all') && selectedArchetypes.length > 0) {
          selectedArchetypes.forEach(archetype => {
            params.append('archetype', archetype);
          });
        }
        // Jeśli "all" jest wybrane lub nic nie jest wybrane, nie dodawaj parametru archetype (pokazuj wszystkie)
        if (selectedFormat !== 'all') {
          params.append('format', selectedFormat);
        }
        if (showUnsaved) {
          params.append('unsaved', 'true');
        }

        const response = await fetch(`/api/content-library?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }

        const data: ContentLibraryResponse = await response.json();
        setImages(data.images);
      } catch (err) {
        console.error('Error fetching content library:', err);
        setError(err instanceof Error ? err.message : 'Failed to load images');
      } finally {
        setIsLoading(false);
      }
    }

    fetchImages();
  }, [currentBrand?.id, isInitialized, selectedArchetypes, selectedFormat, showUnsaved]);

  const handleDownload = async (image: AdImage) => {
    try {
      const response = await fetch(image.publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.title || 'ad-image'}.${image.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  const handleCreateNew = () => {
    router.push('/dashboard/customized-ads');
  };

  const handleArchetypeToggle = (code: string) => {
    setSelectedArchetypes(prev => {
      if (code === 'all') {
        // Jeśli wybieramy "all", zaznacz tylko "all" i odznacz resztę
        if (prev.includes('all')) {
          return []; // Odznacz wszystko
        } else {
          return ['all']; // Zaznacz tylko "all"
        }
      } else {
        // Jeśli wybieramy inną opcję, odznacz "all" i dodaj/usuń tę opcję
        const withoutAll = prev.filter(c => c !== 'all');
        if (withoutAll.includes(code)) {
          return withoutAll.filter(c => c !== code);
        } else {
          return [...withoutAll, code];
        }
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={`header-gradient-dashboard`}>Content library</h1>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <ArchetypeFilterTab
          label="Archetype"
          iconSrc="/assets/icons/Megaphone.svg"
          iconAlt="Archetype"
          selectedValues={selectedArchetypes}
          options={archetypes}
          onToggle={handleArchetypeToggle}
          isOpen={isArchetypeOpen}
          onOpenChange={setIsArchetypeOpen}
        />

        <FilterTab
          label="Format"
          iconSrc="/assets/icons/Ruler.svg"
          iconAlt="Format"
          value={selectedFormat}
          options={formats}
          onSelect={setSelectedFormat}
          isOpen={isFormatOpen}
          onOpenChange={setIsFormatOpen}
        />

        <UnsavedButtonTab
          isActive={showUnsaved}
          onClick={() => setShowUnsaved(!showUnsaved)}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      ) : error ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>{error}</p>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className={styles.grid}>
            {/* Create new card */}
            <div className={styles.createCard} onClick={handleCreateNew}>
              <div className={styles.createCardIcon}>
                <Plus size={32} />
              </div>
              <p className={styles.createCardText}>Tap to create new</p>
            </div>

            {/* Image cards */}
            {images.map((image) => (
              <div key={image.id} className={styles.imageCard}>
                <div className={styles.imageWrapper}>
                  <Image
                    src={image.publicUrl}
                    alt={image.title || 'Ad image'}
                    width={image.width}
                    height={image.height}
                    className={styles.image}
                    unoptimized
                  />
                  {/* Brand logo overlay - positioned at bottom if brand exists */}
                  {image.brand?.name && (
                    <div className={styles.brandOverlay}>
                      <span className={styles.brandName}>{image.brand.name}</span>
                    </div>
                  )}
                </div>
                {/* Action bar with view and download buttons */}
                <div className={styles.actionBar}>
                  <button className={styles.actionButton} title="View details">
                    <FileText size={16} />
                  </button>
                  <button 
                    className={styles.actionButton} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>
                No ads found. {showUnsaved ? 'No unsaved ads.' : 'Create your first ad to see it here!'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
