'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      } catch (error) {
        console.error('Error fetching brand data:', error);
      } finally {
        setIsLoadingBrandData(false);
      }
    };

    fetchBrandData();
  }, [jobId]);

  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ad-${imageId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleGenerateMore = () => {
    console.log('handleGenerateMore');
  };

  const handleRegenerate = () => {
    if (isPaidUser) {
      // Navigate to dashboard for paid users
      router.push('/dashboard');
    } else {
      console.log('handleRegenerate');
    }
  };

  const handlePaidSectionClick = (sectionName: string) => {
    console.log('Paid section clicked:', sectionName);
    // TODO: Navigate to upgrade/payment page or show upgrade modal
    // router.push('/upgrade');
  };

  // Show first 5 images, 6th is blurred with "?" overlay (if more than 5 images and not paid user)
  // Paid users see all images without blur
  const displayImages = images.slice(0, 6);
  const hasMore = images.length > 5 && !isPaidUser;

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
          {displayImages.map((image, index) => {
            const isBlurred = index === 5 && hasMore;
            return (
              <div
                key={image.id}
                className={`${styles.imageCard} ${isBlurred ? styles.blurredCard : ''}`}
                onMouseEnter={() => setHoveredImageId(image.id)}
                onMouseLeave={() => setHoveredImageId(null)}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={image.publicUrl}
                    alt={image.title || 'Generated ad'}
                    className={styles.image}
                  />
                  {isBlurred && (
                    <div className={`${styles.blurredOverlay} ${hoveredImageId === image.id ? styles.blurredOverlayHidden : ''}`}>
                      <span className={styles.questionMark}>?</span>
                    </div>
                  )}
                  {hoveredImageId === image.id && (
                    <>
                      <div className={styles.hoverOverlay} />
                      <button
                        className={styles.downloadButton}
                        onClick={() => handleDownload(image.publicUrl, image.id)}
                        aria-label="Download image"
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
            );
          })}
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
    </div>
  );
}

