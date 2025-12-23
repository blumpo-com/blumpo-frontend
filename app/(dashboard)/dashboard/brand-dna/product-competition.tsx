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
  const [keyFeatures, setKeyFeatures] = useState<string>('');
  const [keyBenefits, setKeyBenefits] = useState<string>('');
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
      // Convert array to bullet-pointed text with spacing between items
      const featuresArray = Array.isArray(brandData.insights?.keyFeatures) ? brandData.insights.keyFeatures : [];
      setKeyFeatures(featuresArray.length > 0 ? featuresArray.map(f => `• ${f}`).join('\n\n') : '');
      const benefitsArray = Array.isArray(brandData.insights?.keyBenefits) ? brandData.insights.keyBenefits : [];
      setKeyBenefits(benefitsArray.length > 0 ? benefitsArray.map(b => `• ${b}`).join('\n\n') : '');
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

  // Convert bullet-pointed text to array
  const textToArray = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
      .filter(line => line.length > 0 && !line.match(/^\s*$/)); // Filter out empty lines
  };

  // Handle key features change
  const handleKeyFeaturesChange = (value: string) => {
    setKeyFeatures(value);
  };

  // Handle key features blur - save to database
  const handleKeyFeaturesBlur = () => {
    const featuresArray = textToArray(keyFeatures);
    saveBrandData({ keyFeatures: featuresArray });
  };

  // Handle key features keydown - auto-add bullet on new line with spacing
  const handleKeyFeaturesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Get the current line to check if it starts with bullet
      const textBeforeCursor = value.substring(0, start);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      const isBulletLine = currentLine.trim().startsWith('•');
      
      // Add bullet point on new line with spacing if previous line was a bullet line
      const spacing = isBulletLine ? '\n\n• ' : '\n• ';
      const newValue = value.substring(0, start) + spacing + value.substring(end);
      setKeyFeatures(newValue);
      
      // Set cursor position after the bullet
      setTimeout(() => {
        const newCursorPos = start + spacing.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
  };

  // Handle key benefits change
  const handleKeyBenefitsChange = (value: string) => {
    setKeyBenefits(value);
  };

  // Handle key benefits blur - save to database
  const handleKeyBenefitsBlur = () => {
    const benefitsArray = textToArray(keyBenefits);
    saveBrandData({ keyBenefits: benefitsArray });
  };

  // Handle key benefits keydown - auto-add bullet on new line with spacing
  const handleKeyBenefitsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Get the current line to check if it starts with bullet
      const textBeforeCursor = value.substring(0, start);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      const isBulletLine = currentLine.trim().startsWith('•');
      
      // Add bullet point on new line with spacing if previous line was a bullet line
      const spacing = isBulletLine ? '\n\n• ' : '\n• ';
      const newValue = value.substring(0, start) + spacing + value.substring(end);
      setKeyBenefits(newValue);
      
      // Set cursor position after the bullet
      setTimeout(() => {
        const newCursorPos = start + spacing.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
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
                <textarea
                  ref={keyFeaturesInputRef}
                  value={keyFeatures}
                  onChange={(e) => handleKeyFeaturesChange(e.target.value)}
                  onBlur={handleKeyFeaturesBlur}
                  onKeyDown={handleKeyFeaturesKeyDown}
                  onFocus={(e) => {
                    // If textarea is empty, add bullet point
                    if (!e.target.value.trim()) {
                      setKeyFeatures('• ');
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = 2;
                      }, 0);
                    }
                  }}
                  placeholder="• Enter key features"
                  className={styles.textarea}
                  rows={6}
                />
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
                <textarea
                  ref={keyBenefitsInputRef}
                  value={keyBenefits}
                  onChange={(e) => handleKeyBenefitsChange(e.target.value)}
                  onBlur={handleKeyBenefitsBlur}
                  onKeyDown={handleKeyBenefitsKeyDown}
                  onFocus={(e) => {
                    // If textarea is empty, add bullet point
                    if (!e.target.value.trim()) {
                      setKeyBenefits('• ');
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = 2;
                      }, 0);
                    }
                  }}
                  placeholder="• Enter key benefits"
                  className={styles.textarea}
                  rows={6}
                />
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
