'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TinderView, AdFormat } from '../tinder-view';
import { TinderViewMixed } from '../tinder-view-mixed';

// Use NEXT_PUBLIC_ prefix for client-side access
const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

// Test ads data
const testAds1_1 = [
  { id: '1', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_1.png', format: '1:1' as const },
  { id: '2', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_2.png', format: '1:1' as const },
  { id: '3', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_3.png', format: '1:1' as const },
  { id: '4', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_2.png', format: '1:1' as const },
  { id: '5', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_3.png', format: '1:1' as const },
];

const testAds16_9 = [
  { id: '1', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_1.png', format: '16:9' as const },
  { id: '2', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_2.png', format: '16:9' as const },
  { id: '3', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_3.png', format: '16:9' as const },
  { id: '4', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_2.png', format: '16:9' as const },
  { id: '5', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_3.png', format: '16:9' as const },
];

const testAdsMixed = [
  ...testAds1_1,
  ...testAds16_9,
];

function TinderPageContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  const formatParam = searchParams.get('format') || '1:1';
  const isTest = searchParams.get('test') === 'true';
  
  const [ads1_1, setAds1_1] = useState(testAds1_1);
  const [ads16_9, setAds16_9] = useState(testAds16_9);
  const [loading, setLoading] = useState(!isTest && !!jobId);
  
  const format: AdFormat = (formatParam === '1:1' || formatParam === '16:9' || formatParam === 'mixed') 
    ? formatParam 
    : '1:1';

  // Fetch real ads if not in test mode
  useEffect(() => {
    if (!isTest && jobId) {
      const fetchAds = async () => {
        try {
          setLoading(true);
          const response = await fetch(`/api/ad-images?jobId=${jobId}`);
          if (response.ok) {
            const adImages = await response.json();
            
            // Group ads by format based on width/height ratio
            const ads1_1List: Array<{ id: string; imageUrl: string; format: '1:1' }> = [];
            const ads16_9List: Array<{ id: string; imageUrl: string; format: '16:9' }> = [];

            adImages.forEach((img: any) => {
              const ratio = img.width / img.height;
              const adData = {
                id: img.id,
                imageUrl: img.publicUrl || img.storageKey,
              };

              // Check if it's square format (1:1) - ratio close to 1
              if (Math.abs(ratio - 1) < 0.15) {
                ads1_1List.push({ ...adData, format: '1:1' as const });
              } 
              // Check if it's 16:9 format - ratio close to 16/9 (≈1.78)
              else if (Math.abs(ratio - 16/9) < 0.2) {
                ads16_9List.push({ ...adData, format: '16:9' as const });
              }
              // Default: if wider than tall, assume 16:9, otherwise 1:1
              else if (ratio > 1.3) {
                ads16_9List.push({ ...adData, format: '16:9' as const });
              } else {
                ads1_1List.push({ ...adData, format: '1:1' as const });
              }
            });

            setAds1_1(ads1_1List);
            setAds16_9(ads16_9List);
          }
        } catch (error) {
          console.error('Error fetching ads:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAds();
    }
  }, [jobId]);

  const handleAddToLibrary = (adId: string) => {
    console.log('Added to library:', adId);
    // TODO: Implement add to library logic
  };

  const handleDelete = (adId: string) => {
    console.log('Deleted:', adId);
    // TODO: Implement delete logic
  };

  const handleSave = async (adId: string, imageUrl: string) => {
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use adId
      const filename = imageUrl.split('/').pop() || `ad-${adId}.png`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Saved ad:', adId);
    } catch (error) {
      console.error('Error saving ad:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh'
      }}>
        <p>Loading ads...</p>
      </div>
    );
  }

  // For mixed format, use separate component with connected ads
  if (format === 'mixed') {
    return (
      <TinderViewMixed
        ads1_1={ads1_1}
        ads16_9={ads16_9}
        onAddToLibrary={handleAddToLibrary}
        onDelete={handleDelete}
        onSave={handleSave}
      />
    );
  }

  // For single format, use regular view
  const ads = format === '1:1' ? ads1_1 : ads16_9;
  
  return (
    <TinderView
      ads={ads}
      format={format}
      onAddToLibrary={handleAddToLibrary}
      onDelete={handleDelete}
      onSave={handleSave}
    />
  );
}

export default function TinderPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh'
      }}>
        <p>Loading...</p>
      </div>
    }>
      <TinderPageContent />
    </Suspense>
  );
}

