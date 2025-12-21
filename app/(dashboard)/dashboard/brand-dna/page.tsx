'use client';

import { useState, useEffect } from 'react';
import { useBrand } from '@/lib/contexts/brand-context';
import { useRouter } from 'next/navigation';
import YourBrandPage from './your-brand';
import ProductCompetitionPage from './product-competition';
import ContentWrapper from './content-wrapper';
import styles from './page.module.css';

interface BrandData {
  id: string;
  name: string;
  websiteUrl: string;
  language: string;
  fonts: any;
  colors: string[];
  photos: string[];
  logoUrl: string | null;
  heroPhotos: string[] | null;
  insights: {
    brandVoice: string | null;
    productDescription: string | null;
    keyFeatures: string[];
    keyBenefits: string[];
    industry: string | null;
    competitors: string[];
  } | null;
}

export default function BrandDNAPage() {
  const { currentBrand } = useBrand();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'your-brand' | 'product-competition' | 'customer-voice'>('your-brand');
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brand data with insights
  useEffect(() => {
    async function fetchBrandData() {
      if (!currentBrand) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // First, use data from context if available
        if (currentBrand) {
          // Populate with context data immediately
          const contextData: BrandData = {
            id: currentBrand.id,
            name: currentBrand.name,
            websiteUrl: currentBrand.websiteUrl || '',
            language: currentBrand.language || 'en',
            fonts: currentBrand.fonts || [],
            colors: currentBrand.colors || [],
            photos: currentBrand.photos || [],
            logoUrl: currentBrand.logoUrl || null,
            heroPhotos: currentBrand.heroPhotos || [],
            insights: null, // Insights not in context, will be loaded separately
          };
          setBrandData(contextData);
        }

        // Then fetch full data with insights
        const response = await fetch(`/api/brand/${currentBrand.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch brand data');
        }
        const data = await response.json();
        setBrandData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBrandData();
  }, [currentBrand?.id]);

  // Update brand data when it changes
  const handleBrandDataUpdate = (updatedData: BrandData) => {
    setBrandData(updatedData);
  };

  if (!currentBrand) {
    return (
      <div className={styles.noBrandContainer}>
        <div className={styles.noBrandContent}>
          <p className={styles.noBrandText}>No brand selected</p>
          <button
            onClick={() => router.push('/dashboard')}
            className={styles.goToDashboardButton}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Tabs Navigation */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsList}>
          <button
            onClick={() => setActiveTab('your-brand')}
            className={`${styles.tabButton} ${
              activeTab === 'your-brand'
                ? styles.tabButtonActive
                : styles.tabButtonInactive
            }`}
          >
            Your brand
          </button>
          <button
            onClick={() => setActiveTab('product-competition')}
            className={`${styles.tabButton} ${
              activeTab === 'product-competition'
                ? styles.tabButtonActive
                : styles.tabButtonInactive
            }`}
          >
            Product & competition
          </button>
          <button
            onClick={() => setActiveTab('customer-voice')}
            className={`${styles.tabButton} ${
              activeTab === 'customer-voice'
                ? styles.tabButtonActive
                : styles.tabButtonInactive
            }`}
          >
            Your customer voice
          </button>
        </div>
      </div>
      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'your-brand' && (
          <YourBrandPage
            brandId={currentBrand.id}
            brandData={brandData}
            isLoading={isLoading}
            error={error}
            onBrandDataUpdate={handleBrandDataUpdate}
          />
        )}
        {activeTab === 'product-competition' && (
          <ProductCompetitionPage
            brandId={currentBrand.id}
            brandData={brandData}
            isLoading={isLoading}
            error={error}
            onBrandDataUpdate={handleBrandDataUpdate}
          />
        )}
        {activeTab === 'customer-voice' && (
          <div className={styles.comingSoonContainer}>
            <p className={styles.comingSoonText}>Your customer voice page - Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
