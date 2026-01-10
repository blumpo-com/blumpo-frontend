'use client';

import { useEffect, useState, useRef } from 'react';
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
  MessageSquare, 
  Ruler, 
  ChevronDown, 
  Trash2, 
  Plus, 
  FileText, 
  Download,
  X
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
  { code: 'random', name: 'Random' },
];

const formats = [
  { code: 'all', name: 'All' },
  { code: '1:1', name: '1:1' },
  { code: '16:9', name: '16:9' },
];

export default function ContentLibraryPage() {
  const router = useRouter();
  const { currentBrand, isInitialized } = useBrand();
  const [images, setImages] = useState<AdImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
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
        if (selectedArchetype !== 'all') {
          params.append('archetype', selectedArchetype);
        }
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
  }, [currentBrand?.id, isInitialized, selectedArchetype, selectedFormat, showUnsaved]);

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

  const selectedArchetypeName = archetypes.find(a => a.code === selectedArchetype)?.name || 'All';
  const selectedFormatName = formats.find(f => f.code === selectedFormat)?.name || 'All';

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Content library</h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Content library</h1>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Content library</h1>
      </div>

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Archetype</label>
          <DropdownMenu open={isArchetypeOpen} onOpenChange={setIsArchetypeOpen}>
            <DropdownMenuTrigger className={styles.filterInput}>
              <MessageSquare className={styles.filterIcon} size={20} />
              <span className={styles.filterValue}>{selectedArchetypeName}</span>
              <ChevronDown className={styles.chevronIcon} size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={styles.dropdownContent}>
              {archetypes.map((archetype) => (
                <DropdownMenuItem
                  key={archetype.code}
                  onClick={() => {
                    setSelectedArchetype(archetype.code);
                    setIsArchetypeOpen(false);
                  }}
                  className={styles.dropdownItem}
                >
                  {archetype.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Format</label>
          <DropdownMenu open={isFormatOpen} onOpenChange={setIsFormatOpen}>
            <DropdownMenuTrigger className={styles.filterInput}>
              <Ruler className={styles.filterIcon} size={20} />
              <span className={styles.filterValue}>{selectedFormatName}</span>
              <ChevronDown className={styles.chevronIcon} size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={styles.dropdownContent}>
              {formats.map((format) => (
                <DropdownMenuItem
                  key={format.code}
                  onClick={() => {
                    setSelectedFormat(format.code);
                    setIsFormatOpen(false);
                  }}
                  className={styles.dropdownItem}
                >
                  {format.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <button
          className={`${styles.unsavedButton} ${showUnsaved ? styles.unsavedButtonActive : ''}`}
          onClick={() => setShowUnsaved(!showUnsaved)}
        >
          <Trash2 className={styles.unsavedIcon} size={16} />
          Unsaved ads
        </button>
      </div>

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

      {images.length === 0 && !isLoading && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            No ads found. {showUnsaved ? 'No unsaved ads.' : 'Create your first ad to see it here!'}
          </p>
        </div>
      )}
    </div>
  );
}
