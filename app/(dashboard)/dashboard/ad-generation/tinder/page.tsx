'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TinderView, AdFormat } from '../tinder-view';

// Test ads data
const testAds1_1 = [
  { id: '1', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_1.png', format: '1:1' as const },
  { id: '2', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_2.png', format: '1:1' as const },
  { id: '3', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_3.png', format: '1:1' as const },
  { id: '4', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_2.png', format: '1:1' as const },
  { id: '5', imageUrl: '/images/default_ads/tinder/tinder_test_1-1_3.png', format: '1:1' as const },
];

const testAds16_9 = [
  { id: '4', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_1.png', format: '16:9' as const },
  { id: '5', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_2.png', format: '16:9' as const },
  { id: '6', imageUrl: '/images/default_ads/tinder/tinder_test_16-9_3.png', format: '16:9' as const },
];

const testAdsMixed = [
  ...testAds1_1,
  ...testAds16_9,
];

function TinderPageContent() {
  const searchParams = useSearchParams();
  const formatParam = searchParams.get('format') || '1:1';
  const format: AdFormat = (formatParam === '1:1' || formatParam === '16:9' || formatParam === 'mixed') 
    ? formatParam 
    : '1:1';

  // Get ads based on format
  const ads = format === '1:1' 
    ? testAds1_1 
    : format === '16:9' 
    ? testAds16_9 
    : testAdsMixed;

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

