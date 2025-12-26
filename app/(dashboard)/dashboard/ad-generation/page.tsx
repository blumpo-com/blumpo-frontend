'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreatingProcess } from './creating-process';
import { ReadyAdsView } from './ready-ads-view';

// Use NEXT_PUBLIC_ prefix for client-side access
const IS_TEST_MODE = process.env.NEXT_PUBLIC_IS_TEST_MODE === 'true';

function AdGenerationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get('job_id');
  
  const [isProcessComplete, setIsProcessComplete] = useState(IS_TEST_MODE);
  const [jobFormats, setJobFormats] = useState<string[] | null>(null);

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

  // Fetch job formats when process completes
  useEffect(() => {
    if (isProcessComplete && jobId) {
      const fetchJobFormats = async () => {
        try {
          const response = await fetch(`/api/generation-job?jobId=${jobId}`);
          if (response.ok) {
            const job = await response.json();
            // Convert formats array to our format type
            // formats might be ['square', 'story'] or similar, need to map to '1:1', '16:9', 'mixed'
            const formats = job.formats || [];
            setJobFormats(formats);
          }
        } catch (error) {
          console.error('Error fetching job formats:', error);
        }
      };
      fetchJobFormats();
    }
  }, [isProcessComplete, jobId]);

  const handleProcessComplete = () => {
    setIsProcessComplete(true);
  };

  const handleSeeAds = async () => {
    if (!jobId) return;

    // if (IS_TEST_MODE) {
    //   // In test mode, navigate to tinder page with format selection
    //   // The ready-ads-view will handle format selection via test buttons
    //   return;
    // }

    // Get format from job
    if (!jobFormats) {
      // Fetch if not already fetched
      try {
        const response = await fetch(`/api/generation-job?jobId=${jobId}`);
        if (response.ok) {
          const job = await response.json();
          const formats = job.formats || [];
          
          // Map database formats to our format type
          // Database uses: 'square' (1:1), 'story' (16:9)
          let format: '1:1' | '16:9' | 'mixed' = '1:1';
          const hasSquare = formats.includes('square') || formats.includes('1:1');
          const hasStory = formats.includes('story') || formats.includes('16:9');
          
          if (hasSquare && hasStory) {
            format = 'mixed';
          } else if (hasStory) {
            format = '16:9';
          } else if (hasSquare) {
            format = '1:1';
          }
          
          router.push(`/dashboard/ad-generation/tinder?job_id=${jobId}&format=${format}`);
        }
      } catch (error) {
        console.error('Error fetching job:', error);
      }
    } else {
      // Use already fetched formats
      let format: '1:1' | '16:9' | 'mixed' = '1:1';
      const hasSquare = jobFormats.includes('square') || jobFormats.includes('1:1');
      const hasStory = jobFormats.includes('story') || jobFormats.includes('16:9');
      
      if (hasSquare && hasStory) {
        format = 'mixed';
      } else if (hasStory) {
        format = '16:9';
      } else if (hasSquare) {
        format = '1:1';
      }
      router.push(`/dashboard/ad-generation/tinder?job_id=${jobId}&format=${format}`);
    }
  };

  // Show ready ads view when process is complete
  if (isProcessComplete) {
    return <ReadyAdsView onSeeAds={handleSeeAds} jobId={jobId || undefined} />;
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

