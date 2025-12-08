'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GenerationJob } from '@/lib/db/schema';
import { useBrand } from './brand-context';

interface GenerationContextType {
  jobId: string | null;
  job: GenerationJob | null;
  isLoading: boolean;
  productPhotos: string[];
  productPhotoMode: 'brand' | 'custom' | 'mixed';
  archetypeCode: string | null;
  archetypeMode: 'single' | 'random';
  formats: string[];
  createJob: () => Promise<void>;
  updateJob: (updates: {
    productPhotoUrls?: string[];
    productPhotoMode?: 'brand' | 'custom' | 'mixed';
    archetypeCode?: string | null;
    archetypeMode?: 'single' | 'random';
    formats?: string[];
  }) => Promise<void>;
  addPhoto: (url: string) => void;
  removePhoto: (url: string) => void;
  deleteJob: () => Promise<void>;
}

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: ReactNode }) {
  const { currentBrand } = useBrand();
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productPhotos, setProductPhotos] = useState<string[]>([]);
  const [productPhotoMode, setProductPhotoMode] = useState<'brand' | 'custom' | 'mixed'>('brand');
  const [archetypeCode, setArchetypeCode] = useState<string | null>(null);
  const [archetypeMode, setArchetypeMode] = useState<'single' | 'random'>('single');
  const [formats, setFormats] = useState<string[]>([]);

  // Initialize from job if it exists
  useEffect(() => {
    if (job) {
      setProductPhotos(job.productPhotoUrls || []);
      const photoMode = job.productPhotoMode;
      if (photoMode === 'brand' || photoMode === 'custom' || photoMode === 'mixed') {
        setProductPhotoMode(photoMode);
      }
      setArchetypeCode(job.archetypeCode || null);
      const archMode = job.archetypeMode;
      if (archMode === 'single' || archMode === 'random') {
        setArchetypeMode(archMode);
      }
      setFormats(job.formats || []);
    }
  }, [job]);

  const createJob = async () => {
    if (jobId) return; // Job already exists

    setIsLoading(true);
    try {
      const response = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: currentBrand?.id,
          productPhotoUrls: productPhotos,
          productPhotoMode,
          archetypeCode,
          archetypeMode,
          formats,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const newJob = await response.json();
      setJobId(newJob.id);
      setJob(newJob);
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateJob = async (updates: {
    productPhotoUrls?: string[];
    productPhotoMode?: 'brand' | 'custom' | 'mixed';
    archetypeCode?: string | null;
    archetypeMode?: 'single' | 'random';
    formats?: string[];
  }) => {
    if (!jobId) {
      await createJob();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/generation-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      const updatedJob = await response.json();
      setJob(updatedJob);

      // Update local state
      if (updates.productPhotoUrls !== undefined) {
        setProductPhotos(updates.productPhotoUrls);
      }
      if (updates.productPhotoMode !== undefined) {
        setProductPhotoMode(updates.productPhotoMode);
      }
      if (updates.archetypeCode !== undefined) {
        setArchetypeCode(updates.archetypeCode);
      }
      if (updates.archetypeMode !== undefined) {
        setArchetypeMode(updates.archetypeMode);
      }
      if (updates.formats !== undefined) {
        setFormats(updates.formats);
      }
    } catch (error) {
      console.error('Error updating job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoto = (url: string) => {
    const newPhotos = [...productPhotos, url];
    setProductPhotos(newPhotos);
    updateJob({ productPhotoUrls: newPhotos });
  };

  const removePhoto = (url: string) => {
    const newPhotos = productPhotos.filter((p) => p !== url);
    setProductPhotos(newPhotos);
    updateJob({ productPhotoUrls: newPhotos });
  };

  const deleteJob = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/generation-job?jobId=${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      setJobId(null);
      setJob(null);
      setProductPhotos([]);
      setProductPhotoMode('brand');
      setArchetypeCode(null);
      setArchetypeMode('single');
      setFormats([]);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jobId) {
        // Delete job if user navigates away without completing
        deleteJob().catch(console.error);
      }
    };
  }, []);

  return (
    <GenerationContext.Provider
      value={{
        jobId,
        job,
        isLoading,
        productPhotos,
        productPhotoMode,
        archetypeCode,
        archetypeMode,
        formats,
        createJob,
        updateJob,
        addPhoto,
        removePhoto,
        deleteJob,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}

