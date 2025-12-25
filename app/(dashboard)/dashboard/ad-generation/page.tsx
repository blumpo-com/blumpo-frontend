'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreatingProcess } from './creating-process';
import { ReadyAdsView } from './ready-ads-view';

function AdGenerationPageContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('job_id');
  
  const [isProcessComplete, setIsProcessComplete] = useState(false);

  // If no job_id, show error or redirect
  if (!jobId) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1>No job ID provided</h1>
        <p>Please provide a valid job_id in the URL</p>
      </div>
    );
  }

  const handleProcessComplete = () => {
    setIsProcessComplete(true);
  };

  const handleSeeAds = () => {
    // TODO: Navigate to ads view (tinder mode) with job_id
    console.log('See ads clicked for job:', jobId);
    // Example: router.push(`/dashboard/ads-view?job_id=${jobId}`);
  };

  // Show ready ads view when process is complete
  if (isProcessComplete) {
    return <ReadyAdsView onSeeAds={handleSeeAds} />;
  }

  // Show creating process
  return (
    <CreatingProcess 
      onComplete={handleProcessComplete}
    />
  );
}

export default function AdGenerationPage() {
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
      <AdGenerationPageContent />
    </Suspense>
  );
}

