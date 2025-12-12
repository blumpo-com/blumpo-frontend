'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Brand } from '@/lib/db/schema';

interface BrandContextType {
  currentBrand: Brand | null;
  setCurrentBrand: (brand: Brand | null) => void;
  isInitialized: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const STORAGE_KEY = 'blumpo_current_brand_id';

export function BrandProvider({ children }: { children: ReactNode }) {
  const [currentBrand, setCurrentBrandState] = useState<Brand | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load brand from localStorage on mount
  useEffect(() => {
    const storedBrandId = localStorage.getItem(STORAGE_KEY);
    if (storedBrandId) {
      // Fetch brand data from API
      fetch('/api/brands')
        .then((res) => res.json())
        .then((brands: Brand[]) => {
          const brand = brands.find((b) => b.id === storedBrandId);
          if (brand) {
            setCurrentBrandState(brand);
          } else {
            // Brand not found, clear storage
            localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => {
          // Error fetching, clear storage
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => {
          setIsInitialized(true);
        });
    } else {
      setIsInitialized(true);
    }
  }, []);

  const setCurrentBrand = (brand: Brand | null) => {
    setCurrentBrandState(brand);
    if (brand) {
      localStorage.setItem(STORAGE_KEY, brand.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <BrandContext.Provider value={{ currentBrand, setCurrentBrand, isInitialized }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

