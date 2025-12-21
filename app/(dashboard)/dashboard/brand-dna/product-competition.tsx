'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import ContentWrapper from './content-wrapper';
import styles from './product-competition.module.css';

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
    targetCustomers: string[];
    redditCustomerPainPoints: string[];
    insTriggerEvents: string[];
    insAspirations: string[];
  } | null;
}

interface ProductCompetitionPageProps {
  brandId: string;
  brandData: BrandData | null;
  isLoading: boolean;
  error: string | null;
  onBrandDataUpdate: (data: BrandData) => void;
}

export default function ProductCompetitionPage({ 
  brandId, 
  brandData, 
  isLoading: isLoadingData, 
  error: fetchError, 
  onBrandDataUpdate 
}: ProductCompetitionPageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Form state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [keyFeaturesInput, setKeyFeaturesInput] = useState('');
  const [isKeyFeaturesFocused, setIsKeyFeaturesFocused] = useState(false);
  const [keyBenefits, setKeyBenefits] = useState<string[]>([]);
  const [keyBenefitsInput, setKeyBenefitsInput] = useState('');
  const [isKeyBenefitsFocused, setIsKeyBenefitsFocused] = useState(false);
  const [industry, setIndustry] = useState<string[]>([]);
  const [industryInput, setIndustryInput] = useState('');
  const [isIndustryFocused, setIsIndustryFocused] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorsInput, setCompetitorsInput] = useState('');
  const [isCompetitorsFocused, setIsCompetitorsFocused] = useState(false);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const keyFeaturesInputRef = useRef<HTMLTextAreaElement>(null);
  const keyBenefitsInputRef = useRef<HTMLTextAreaElement>(null);

  // Populate form fields from brandData
  useEffect(() => {
    if (brandData) {
      setLogoUrl(brandData.logoUrl || null);
      setProductDescription(brandData.insights?.productDescription || '');
      setKeyFeatures(Array.isArray(brandData.insights?.keyFeatures) ? brandData.insights.keyFeatures : []);
      setKeyBenefits(Array.isArray(brandData.insights?.keyBenefits) ? brandData.insights.keyBenefits : []);
      // Handle industry - could be string or array
      const industryValue = brandData.insights?.industry;
      if (industryValue) {
        // If it's a string, try to parse as comma-separated or use as single item
        if (typeof industryValue === 'string') {
          setIndustry(industryValue.includes(',') ? industryValue.split(',').map(s => s.trim()).filter(Boolean) : [industryValue]);
        } else if (Array.isArray(industryValue)) {
          setIndustry(industryValue);
        }
      } else {
        setIndustry([]);
      }
      setCompetitors(Array.isArray(brandData.insights?.competitors) ? brandData.insights.competitors : []);
      setInsightsLoaded(brandData.insights !== null);
    }
  }, [brandData]);

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setError(null);
      
      // First, delete old logo if it exists
      if (logoUrl) {
        try {
          await fetch(`/api/delete-photo?url=${encodeURIComponent(logoUrl)}&brandId=${brandId}&type=logo`, {
            method: 'DELETE',
          });
        } catch (deleteErr) {
          console.error('Error deleting old logo:', deleteErr);
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('brandId', brandId);
      formData.append('type', 'logo');

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }

      const { url } = await response.json();
      setLogoUrl(url);
      
      // Update brand with logo URL
      await saveBrandData({ logoUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Save brand data
  const saveBrandData = async (updates: any) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/brand/${brandId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand data');
      }

      const updated = await response.json();
      onBrandDataUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle product description change
  const handleProductDescriptionChange = (value: string) => {
    setProductDescription(value);
  };

  // Handle key features - add from textarea (bullet points)
  const handleKeyFeaturesBlur = () => {
    if (keyFeaturesInput.trim()) {
      // Split by newlines and filter empty
      const features = keyFeaturesInput
        .split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0);
      
      if (features.length > 0) {
        const newFeatures = [...keyFeatures, ...features];
        setKeyFeatures(newFeatures);
        setKeyFeaturesInput('');
        setIsKeyFeaturesFocused(false);
        saveBrandData({ keyFeatures: newFeatures });
      }
    }
  };

  // Remove key feature
  const handleRemoveKeyFeature = (index: number) => {
    const newFeatures = keyFeatures.filter((_, i) => i !== index);
    setKeyFeatures(newFeatures);
    saveBrandData({ keyFeatures: newFeatures });
  };

  // Handle key benefits - add from textarea (bullet points)
  const handleKeyBenefitsBlur = () => {
    if (keyBenefitsInput.trim()) {
      // Split by newlines and filter empty
      const benefits = keyBenefitsInput
        .split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0);
      
      if (benefits.length > 0) {
        const newBenefits = [...keyBenefits, ...benefits];
        setKeyBenefits(newBenefits);
        setKeyBenefitsInput('');
        setIsKeyBenefitsFocused(false);
        saveBrandData({ keyBenefits: newBenefits });
      }
    }
  };

  // Remove key benefit
  const handleRemoveKeyBenefit = (index: number) => {
    const newBenefits = keyBenefits.filter((_, i) => i !== index);
    setKeyBenefits(newBenefits);
    saveBrandData({ keyBenefits: newBenefits });
  };

  // Handle industry tags
  const handleAddIndustry = () => {
    const trimmed = industryInput.trim();
    if (trimmed && !industry.includes(trimmed)) {
      const newIndustry = [...industry, trimmed];
      setIndustry(newIndustry);
      setIndustryInput('');
      setIsIndustryFocused(false);
      // Store as comma-separated string (schema has industry as text)
      saveBrandData({ industry: newIndustry.join(', ') });
    }
  };

  const handleRemoveIndustry = (index: number) => {
    const newIndustry = industry.filter((_, i) => i !== index);
    setIndustry(newIndustry);
    // Store as comma-separated string or null if empty
    saveBrandData({ industry: newIndustry.length > 0 ? newIndustry.join(', ') : null });
  };

  // Handle competitors tags
  const handleAddCompetitor = () => {
    const trimmed = competitorsInput.trim();
    if (trimmed && !competitors.includes(trimmed)) {
      const newCompetitors = [...competitors, trimmed];
      setCompetitors(newCompetitors);
      setCompetitorsInput('');
      setIsCompetitorsFocused(false);
      saveBrandData({ competitors: newCompetitors });
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    const newCompetitors = competitors.filter((_, i) => i !== index);
    setCompetitors(newCompetitors);
    saveBrandData({ competitors: newCompetitors });
  };

  // Save product description on blur
  const handleProductDescriptionBlur = () => {
    saveBrandData({ productDescription: productDescription });
  };

  if (isLoadingData && !brandData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading brand data...</div>
      </div>
    );
  }

  if (fetchError && !brandData) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorText}>Error: {fetchError}</div>
      </div>
    );
  }

  if (!brandData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.grid}>
          {/* Left Column */}
          <div className={styles.column}>
            <ContentWrapper
              brandName={brandData.name}
              logoUrl={logoUrl}
              onLogoUpload={handleLogoUpload}
              isUploadingLogo={isUploadingLogo}
            />
            {/* Key Features */}
            <div>
              <Label className={styles.label}>
                Key features
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <div className={styles.featuresContainer}>
                  {keyFeatures.length > 0 && (
                    <div className={styles.featuresList}>
                      {keyFeatures.map((feature, index) => (
                        <div key={index} className={styles.featureChip}>
                          <span>{feature}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyFeature(index)}
                            className={styles.featureRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isKeyFeaturesFocused || keyFeatures.length === 0 ? (
                    <textarea
                      ref={keyFeaturesInputRef}
                      value={keyFeaturesInput}
                      onChange={(e) => setKeyFeaturesInput(e.target.value)}
                      onBlur={handleKeyFeaturesBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsKeyFeaturesFocused(false);
                          setKeyFeaturesInput('');
                        }
                      }}
                      placeholder="• Enter key features"
                      className={styles.textarea}
                      rows={4}
                    />
                  ) : (
                    <div
                      className={styles.featuresPlaceholder}
                      onClick={() => {
                        setIsKeyFeaturesFocused(true);
                        setTimeout(() => keyFeaturesInputRef.current?.focus(), 0);
                      }}
                    >
                      {keyFeatures.length === 0 ? 'Click to add key features' : 'Click to add more features'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key Benefits */}
            <div>
              <Label className={styles.label}>
                Key benefits
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <div className={styles.benefitsContainer}>
                  {keyBenefits.length > 0 && (
                    <div className={styles.benefitsList}>
                      {keyBenefits.map((benefit, index) => (
                        <div key={index} className={styles.benefitChip}>
                          <span>{benefit}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyBenefit(index)}
                            className={styles.benefitRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isKeyBenefitsFocused || keyBenefits.length === 0 ? (
                    <textarea
                      ref={keyBenefitsInputRef}
                      value={keyBenefitsInput}
                      onChange={(e) => setKeyBenefitsInput(e.target.value)}
                      onBlur={handleKeyBenefitsBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsKeyBenefitsFocused(false);
                          setKeyBenefitsInput('');
                        }
                      }}
                      placeholder="• Enter key benefits"
                      className={styles.textarea}
                      rows={4}
                    />
                  ) : (
                    <div
                      className={styles.benefitsPlaceholder}
                      onClick={() => {
                        setIsKeyBenefitsFocused(true);
                        setTimeout(() => keyBenefitsInputRef.current?.focus(), 0);
                      }}
                    >
                      {keyBenefits.length === 0 ? 'Click to add key benefits' : 'Click to add more benefits'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.column}>
            {/* Product Description */}
            <div>
              <Label className={styles.label}>
                Product description
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <textarea
                  value={productDescription}
                  onChange={(e) => handleProductDescriptionChange(e.target.value)}
                  onBlur={handleProductDescriptionBlur}
                  placeholder="Tell us about your brand"
                  className={styles.textarea}
                  rows={6}
                />
              )}
            </div>

            {/* Industry */}
            <div>
              <Label className={styles.label}>
                Industry
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonInput} />
              ) : (
                <div className={styles.tagsContainer}>
                  {industry.length > 0 && (
                    <div className={styles.tagsList}>
                      {industry.map((tag, index) => (
                        <div key={index} className={styles.tagChip}>
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveIndustry(index)}
                            className={styles.tagRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isIndustryFocused || industry.length === 0 ? (
                    <div className={styles.tagInputWrapper}>
                      <input
                        type="text"
                        value={industryInput}
                        onChange={(e) => setIndustryInput(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!industryInput.trim()) {
                              setIsIndustryFocused(false);
                            }
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddIndustry();
                          }
                          if (e.key === 'Escape') {
                            setIsIndustryFocused(false);
                            setIndustryInput('');
                          }
                        }}
                        placeholder="Enter industry"
                        className={styles.tagInput}
                        autoFocus={isIndustryFocused}
                      />
                      <button
                        type="button"
                        onClick={handleAddIndustry}
                        className={styles.tagAddButton}
                        disabled={!industryInput.trim() || industry.includes(industryInput.trim())}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.tagsPlaceholder}
                      onClick={() => setIsIndustryFocused(true)}
                    >
                      Click to add industry
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Competitors */}
            <div>
              <Label className={styles.label}>
                Competitors
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonInput} />
              ) : (
                <div className={styles.tagsContainer}>
                  {competitors.length > 0 && (
                    <div className={styles.tagsList}>
                      {competitors.map((competitor, index) => (
                        <div key={index} className={styles.tagChip}>
                          <span>{competitor}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompetitor(index)}
                            className={styles.tagRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isCompetitorsFocused || competitors.length === 0 ? (
                    <div className={styles.tagInputWrapper}>
                      <input
                        type="text"
                        value={competitorsInput}
                        onChange={(e) => setCompetitorsInput(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!competitorsInput.trim()) {
                              setIsCompetitorsFocused(false);
                            }
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCompetitor();
                          }
                          if (e.key === 'Escape') {
                            setIsCompetitorsFocused(false);
                            setCompetitorsInput('');
                          }
                        }}
                        placeholder="Enter competitor"
                        className={styles.tagInput}
                        autoFocus={isCompetitorsFocused}
                      />
                      <button
                        type="button"
                        onClick={handleAddCompetitor}
                        className={styles.tagAddButton}
                        disabled={!competitorsInput.trim() || competitors.includes(competitorsInput.trim())}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.tagsPlaceholder}
                      onClick={() => setIsCompetitorsFocused(true)}
                    >
                      Click to add competitors
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {isSaving && (
          <div className={styles.savingMessage}>
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}
