'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import styles from './generated-ads-display.module.css';

interface AdImage {
  id: string;
  title: string | null;
  publicUrl: string;
  width: number | null;
  height: number | null;
  format: string;
  workflowId: string | null;
  archetype: {
    code: string;
    displayName: string;
    description: string | null;
  } | null;
  createdAt: string;
}

interface BrandData {
  id: string;
  name: string;
  websiteUrl: string;
  language: string;
  fonts: any;
  colors: string[];
  logoUrl: string | null;
}

interface BrandInsights {
  customerPainPoints: string[];
  targetCustomers: string[];
  customerGroups: string[];
  redditCustomerPainPoints: any;
  redditCustomerDesires: any;
}

interface GeneratedAdsDisplayProps {
  images: AdImage[];
  jobId: string;
  isPaidUser?: boolean;
}

const archetypes = [
  {
    code: 'problem_solution',
    displayName: 'Problem-Solution',
    description: 'Show user\'s pain point and how your product resolves it',
  },
  {
    code: 'testimonial',
    displayName: 'Testimonial',
    description: 'Build the ad around a customer review or quote',
  },
  {
    code: 'meme',
    displayName: 'Meme',
    description: 'Create a meme ad',
  },
  {
    code: 'competitor_comparison',
    displayName: 'Competitor Comparison',
    description: 'Visually present how the product works vs competitors',
  },
  {
    code: 'promotion_offer',
    displayName: 'Promotion (Offer)',
    description: 'Communicate a clear, time-limited deal to prompt immediate action',
  },
  {
    code: 'value_proposition',
    displayName: 'Value Proposition',
    description: 'Highlight the core benefit and what sets the product apart',
  },
];

export function GeneratedAdsDisplay({ images, jobId, isPaidUser = false }: GeneratedAdsDisplayProps) {
  const router = useRouter();
  const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [insights, setInsights] = useState<BrandInsights | null>(null);
  const [isLoadingBrandData, setIsLoadingBrandData] = useState(true);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

  // Fetch brand data and insights
  useEffect(() => {
    if (!jobId) {
      setIsLoadingBrandData(false);
      return;
    }

    const fetchBrandData = async () => {
      try {
        const res = await fetch(`/api/generate/brand-data?job_id=${jobId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.brand) {
            setBrandData(data.brand);
          }
          if (data.insights) {
            setInsights(data.insights);
          }
        }
        // If get 401 unathorized user navigate to sign in page
        if (res.status === 401) {
          router.push('/sign-in');
        }
      } catch (error) {
        console.error('Error fetching brand data:', error);
      } finally {
        setIsLoadingBrandData(false);
      }
    };

    fetchBrandData();
  }, [jobId]);

  const handleDownload = async (imageUrl: string, imageId: string) => {
    // Prevent multiple simultaneous downloads of the same image
    if (downloadingIds.has(imageId)) {
      return;
    }
    
    // Set downloading state
    setDownloadingIds(prev => new Set(prev).add(imageId));
    
    try {
      // Fetch the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use adId
      const filename = imageUrl.split('/').pop() || `ad-${imageId}.png`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Track download in state
      setDownloadedIds(prev => new Set(prev).add(imageId));
      
      // Log download event to analytics
      try {
        const analyticsResponse = await fetch('/api/ad-actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobId,
            downloadedIds: [imageId],
          }),
        });
        
        if (!analyticsResponse.ok) {
          console.error('Failed to log download event');
        }
      } catch (analyticsError) {
        console.error('Error logging download event:', analyticsError);
        // Don't fail the download if analytics fails
      }
      
      console.log('Downloaded ad:', imageId);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      // Clear downloading state
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  const handleGenerateMore = () => {
    console.log('handleGenerateMore');
    setShowComingSoonDialog(true);
  };

  const handleRegenerate = () => {
    if (isPaidUser) {
      // Navigate to dashboard for paid users
      router.push('/dashboard');
    } else {
      console.log('handleRegenerate');
      setShowComingSoonDialog(true);
    }
  };

  const handlePaidSectionClick = (sectionName: string) => {
    console.log('Paid section clicked:', sectionName);
    setShowComingSoonDialog(true);
  };

  // Display logic:
  // - If 5 or fewer images for non-paid user: show images 2-5 (skip first), then show first image as blurred at the end
  // - If 6 or more images for non-paid user: show first 5 images, then 6th image as blurred
  // - Paid users see all images without blur
  const hasFiveOrLess = images.length <= 5 && !isPaidUser;
  const hasSixOrMore = images.length >= 6 && !isPaidUser;
  
  let displayImages: AdImage[] = [];
  let blurredImage: AdImage | null = null;
  
  if (hasFiveOrLess && images.length > 0) {
    // Show images (1-5), then add blurred first image at the end
    displayImages = images.slice(0, 5);
    blurredImage = images[0];
  } else if (hasSixOrMore) {
    // Show first 5 images, then add blurred 6th image at the end
    displayImages = images.slice(0, 5);
    blurredImage = images[5];
  } else {
    // Paid users or edge cases: show all images
    displayImages = images.slice(0, 6);
  }

  return (
    <div className={styles.container}>
      {/* Left Panel - Generated Ads */}
      <div className={styles.leftPanel}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.titleText}>
              Ads crafted for your brand are here <span className={styles.titleEmoji}>👋</span>
            </span>
          </h1>
          <p className={styles.subtitle}>
            Hover over and download them for free!
          </p>
        </div>
        
        <div className={styles.imagesGrid}>
          {/* Display non-blurred images first */}
          {displayImages.map((image) => {
            return (
              <div
                key={image.id}
                className={styles.imageCard}
                onMouseEnter={() => setHoveredImageId(image.id)} // Image id with flag if it is blurred
                onMouseLeave={() => setHoveredImageId(null)}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={image.publicUrl}
                    alt={image.title || 'Generated ad'}
                    className={styles.image}
                  />
                  {hoveredImageId === image.id && (
                    <>
                      <div className={styles.hoverOverlay} />
                      <button
                        className={`${styles.downloadButton} ${downloadingIds.has(image.id) ? styles.downloadButtonLoading : ''}`}
                        onClick={() => handleDownload(image.publicUrl, image.id)}
                        disabled={downloadingIds.has(image.id)}
                        aria-label={downloadingIds.has(image.id) ? 'Downloading...' : 'Download image'}
                      >
                        {downloadingIds.has(image.id) ? (
                          <>
                            <p className={styles.downloadText}>Downloading...</p>
                            <div className={styles.downloadSpinner}></div>
                          </>
                        ) : (
                          <>
                            <p className={styles.downloadText}>Download image</p>
                            <svg className={styles.downloadIcon} width="17" height="20" viewBox="0 0 17 20" fill="none">
                              <path d="M8.5 0L8.5 14M8.5 14L1 6.5M8.5 14L16 6.5M1 19L16 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Display blurred image at the end if applicable */}
          {blurredImage && (
            <div
              key={blurredImage.id + '-blurred'}
              className={`${styles.imageCard} ${styles.blurredCard}`}
              onMouseEnter={() => setHoveredImageId(blurredImage!.id + '-blurred')}
              onMouseLeave={() => setHoveredImageId(null)}
            >
              <div className={styles.imageWrapper}>
                <img
                  src={blurredImage.publicUrl}
                  alt={blurredImage.title || 'Generated ad'}
                  className={styles.image}
                />
                <div className={`${styles.blurredOverlay} ${hoveredImageId === (blurredImage.id + '-blurred') ? styles.blurredOverlayHidden : ''}`}>
                  <span className={styles.questionMark}>?</span>
                </div>
                {hoveredImageId === (blurredImage.id + '-blurred') && (
                  <>
                    <div className={styles.hoverOverlay} />
                    <button
                      className={`${styles.downloadButton} ${downloadingIds.has(blurredImage.id) ? styles.downloadButtonLoading : ''}`}
                      onClick={() => handlePaidSectionClick('blurred-ad-download')}
                      disabled={downloadingIds.has(blurredImage.id)}
                      aria-label="Upgrade to download"
                    >
                      <p className={styles.downloadText}>Download image</p>
                      <svg className={styles.downloadIcon} width="17" height="20" viewBox="0 0 17 20" fill="none">
                        <path d="M8.5 0L8.5 14M8.5 14L1 6.5M8.5 14L16 6.5M1 19L16 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Insights & Details */}
      <div className={styles.rightPanel}>
        <div className={styles.insightsSection}>
          <p className={styles.insightsTitle}>
            Insights & components based on your website, Reddit and social media research
          </p>
        </div>

        {/* Brand Components Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Input tag name</h2>
          <div className={styles.brandComponents}>
            <div className={styles.brandComponent}>
              <p className={styles.componentLabel}>Logo</p>
              <div className={styles.componentBox}>
                {isLoadingBrandData ? (
                  <div className={styles.skeletonLogo} />
                ) : brandData?.logoUrl ? (
                  <img 
                    src={brandData.logoUrl} 
                    alt={`${brandData.name} logo`}
                    className={styles.logoImage}
                  />
                ) : null}
              </div>
            </div>
            <div className={styles.brandComponent}>
              <p className={styles.componentLabel}>Colors</p>
              <div className={styles.colorsBox}>
                {isLoadingBrandData ? (
                  <div className={styles.colorSwatches}>
                    <div className={styles.skeletonColorSwatch} />
                    <div className={styles.skeletonColorSwatch} />
                    <div className={styles.skeletonColorSwatch} />
                    <div className={styles.skeletonColorSwatch} />
                  </div>
                ) : brandData?.colors && brandData.colors.length > 0 ? (
                  <div className={styles.colorSwatches}>
                    {brandData.colors.slice(0, 4).map((color, index) => (
                      <div 
                        key={index} 
                        className={styles.colorSwatch} 
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className={styles.brandComponent}>
              <p className={styles.componentLabel}>Font</p>
              <div className={styles.componentBox}>
                {isLoadingBrandData ? (
                  <div className={styles.skeletonFont} />
                ) : (
                  <p className={styles.fontName}>
                    {(() => {
                      if (!brandData?.fonts) return null;
                      if (typeof brandData.fonts === 'string') return brandData.fonts;
                      if (Array.isArray(brandData.fonts) && brandData.fonts.length > 0) {
                        // Sort by count (descending) to get most popular font
                        const sortedFonts = [...brandData.fonts].sort((a, b) => {
                          const countA = typeof a === 'object' && a !== null ? (a.count || 0) : 0;
                          const countB = typeof b === 'object' && b !== null ? (b.count || 0) : 0;
                          return countB - countA;
                        });
                        const mostPopularFont = sortedFonts[0];
                        if (typeof mostPopularFont === 'string') return mostPopularFont;
                        if (typeof mostPopularFont === 'object' && mostPopularFont !== null) {
                          return mostPopularFont.fontFamily || mostPopularFont.family || null;
                        }
                      }
                      return null;
                    })()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Customer Insights Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Customer insights</h2>
          <div className={styles.insightsGrid}>
            <div className={styles.insightBox}>
              <p className={styles.insightLabel}>Customer pain points</p>
              <div className={styles.insightContent}>
                {isLoadingBrandData ? (
                  <div className={styles.skeletonInsightList}>
                    <div className={styles.skeletonInsightItem} />
                    <div className={styles.skeletonInsightItem} />
                    <div className={styles.skeletonInsightItem} />
                  </div>
                ) : insights?.customerPainPoints && insights.customerPainPoints.length > 0 ? (
                  <ul className={styles.insightList}>
                    {insights.customerPainPoints.slice(0, 5).map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : insights?.redditCustomerPainPoints && Array.isArray(insights.redditCustomerPainPoints) && insights.redditCustomerPainPoints.length > 0 ? (
                  <ul className={styles.insightList}>
                    {insights.redditCustomerPainPoints.slice(0, 5).map((point: any, index: number) => (
                      <li key={index}>{typeof point === 'string' ? point : point?.text || point?.point || JSON.stringify(point)}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            <div className={styles.insightBox}>
              <p className={styles.insightLabel}>Customer groups</p>
              <div className={styles.insightContent}>
                {isLoadingBrandData ? (
                  <div className={styles.skeletonInsightList}>
                    <div className={styles.skeletonInsightItem} />
                    <div className={styles.skeletonInsightItem} />
                    <div className={styles.skeletonInsightItem} />
                  </div>
                ) : insights?.targetCustomers && insights.targetCustomers.length > 0 ? (
                  <ul className={styles.insightList}>
                    {insights.targetCustomers.slice(0, 5).map((group, index) => (
                      <li key={index}>{group}</li>
                    ))}
                  </ul>
                ) : insights?.customerGroups && insights.customerGroups.length > 0 ? (
                  <ul className={styles.insightList}>
                    {insights.customerGroups.slice(0, 5).map((group, index) => (
                      <li key={index}>{group}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <button className={styles.actionButton} onClick={handleGenerateMore}>
          <span>Generate more ads with Blumpo</span>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={styles.divider} />

        {/* Ad Types Section */}
        <div className={styles.section} onClick={!isPaidUser ? () => handlePaidSectionClick('ad-types') : undefined} style={!isPaidUser ? { cursor: 'pointer' } : undefined}>
          <div className={styles.sectionHeader}>
            {!isPaidUser && (
              <div className={styles.paidBadge}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                </svg>
                <span>Paid only</span>
              </div>
            )}
            <h2 className={styles.sectionTitle}>Ad types</h2>
          </div>
          <div className={styles.archetypesGrid}>
            {archetypes
              .map((archetype) => (
                <div key={archetype.code} className={styles.archetypeCard}>
                  {archetype.displayName}
                </div>
              ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Ad Formats Section */}
        <div className={styles.section}>
          <div className={styles.formatsRow}>
            <div className={styles.formatGroup} onClick={!isPaidUser ? () => handlePaidSectionClick('ad-formats') : undefined} style={!isPaidUser ? { cursor: 'pointer' } : undefined}>
              <div className={styles.sectionHeader}>
                {!isPaidUser && (
                  <div className={styles.paidBadge}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                    </svg>
                    <span>Paid only</span>
                  </div>
                )}
                <h2 className={styles.sectionTitle}>Different ad formats</h2>
              </div>
              <div className={styles.formatBoxes}>
                <div className={styles.formatBox}>1:1</div>
                <div className={styles.formatBox}>16:9</div>
              </div>
            </div>
            <div className={styles.formatGroup} onClick={!isPaidUser ? () => handlePaidSectionClick('language') : undefined} style={!isPaidUser ? { cursor: 'pointer' } : undefined}>
              <div className={styles.sectionHeader}>
                {!isPaidUser && (
                  <div className={styles.paidBadge}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 1L7.5 4.5L11 6L7.5 7.5L6 11L4.5 7.5L1 6L4.5 4.5L6 1Z" fill="currentColor" />
                    </svg>
                    <span>Paid only</span>
                  </div>
                )}
                <h2 className={styles.sectionTitle}>Language</h2>
              </div>
              <div className={styles.languageBox}>
                {isLoadingBrandData ? (
                  <div className={styles.skeletonLanguage} />
                ) : brandData?.language ? (
                  <span>
                    {brandData.language === 'en' || brandData.language === 'English' ? '🇬🇧 English' 
                      : brandData.language === 'pl' || brandData.language === 'Polish' ? '🇵🇱 Polish'
                      : brandData.language === 'de' || brandData.language === 'German' ? '🇩🇪 German'
                      : brandData.language === 'fr' || brandData.language === 'French' ? '🇫🇷 French'
                      : brandData.language === 'es' || brandData.language === 'Spanish' ? '🇪🇸 Spanish'
                      : `🌐 ${brandData.language.toUpperCase()}`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <button className={styles.actionButton} onClick={handleRegenerate}>
          <span>{isPaidUser ? 'Login to main platform' : 'Regenerate ads'}</span>
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoonDialog} onClose={() => setShowComingSoonDialog(false)}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px', color: '#000' }}>Coming soon</h2>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          This feature will be available soon. Stay tuned!
        </p>
        <button
          onClick={() => setShowComingSoonDialog(false)}
          style={{
            backgroundColor: '#f97316',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          OK
        </button>
      </Dialog>
    </div>
  );
}

