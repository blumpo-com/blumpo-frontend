'use client';

import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';
import ContentWrapper from './content-wrapper';
import styles from './customer-voice.module.css';

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

interface CustomerVoicePageProps {
  brandId: string;
  brandData: BrandData | null;
  isLoading: boolean;
  error: string | null;
  onBrandDataUpdate: (data: BrandData) => void;
}

export default function CustomerVoicePage({ 
  brandId, 
  brandData, 
  isLoading: isLoadingData, 
  error: fetchError, 
  onBrandDataUpdate 
}: CustomerVoicePageProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Form state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [targetCustomers, setTargetCustomers] = useState<string[]>([]);
  const [targetCustomersInput, setTargetCustomersInput] = useState('');
  const [isTargetCustomersFocused, setIsTargetCustomersFocused] = useState(false);
  const [customerPainPoints, setCustomerPainPoints] = useState<string>('');
  const [purchaseTriggers, setPurchaseTriggers] = useState<string>('');
  const [customerExpectations, setCustomerExpectations] = useState<string>('');
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const customerPainPointsInputRef = useRef<HTMLTextAreaElement>(null);
  const purchaseTriggersInputRef = useRef<HTMLTextAreaElement>(null);
  const customerExpectationsInputRef = useRef<HTMLTextAreaElement>(null);

  // Populate form fields from brandData
  useEffect(() => {
    if (brandData) {
      setLogoUrl(brandData.logoUrl || null);
      setTargetCustomers(Array.isArray(brandData.insights?.targetCustomers) ? brandData.insights.targetCustomers : []);
      // Convert arrays to bullet-pointed text with spacing between items
      const painPointsArray = Array.isArray(brandData.insights?.redditCustomerPainPoints) ? brandData.insights.redditCustomerPainPoints : [];
      setCustomerPainPoints(painPointsArray.length > 0 ? painPointsArray.map(p => `• ${p}`).join('\n\n') : '');
      const triggersArray = Array.isArray(brandData.insights?.insTriggerEvents) ? brandData.insights.insTriggerEvents : [];
      setPurchaseTriggers(triggersArray.length > 0 ? triggersArray.map(t => `• ${t}`).join('\n\n') : '');
      const expectationsArray = Array.isArray(brandData.insights?.insAspirations) ? brandData.insights.insAspirations : [];
      setCustomerExpectations(expectationsArray.length > 0 ? expectationsArray.map(e => `• ${e}`).join('\n\n') : '');
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

  // Handle target customers tags
  const handleAddTargetCustomer = () => {
    const trimmed = targetCustomersInput.trim();
    if (trimmed && !targetCustomers.includes(trimmed)) {
      const newTargetCustomers = [...targetCustomers, trimmed];
      setTargetCustomers(newTargetCustomers);
      setTargetCustomersInput('');
      setIsTargetCustomersFocused(false);
      saveBrandData({ targetCustomers: newTargetCustomers });
    }
  };

  const handleRemoveTargetCustomer = (index: number) => {
    const newTargetCustomers = targetCustomers.filter((_, i) => i !== index);
    setTargetCustomers(newTargetCustomers);
    saveBrandData({ targetCustomers: newTargetCustomers });
  };

  // Convert bullet-pointed text to array
  const textToArray = (text: string): string[] => {
    return text
      .split('\n')
      .map((line: string) => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
      .filter((line: string) => line.length > 0 && !line.match(/^\s*$/)); // Filter out empty lines
  };

  // Handle customer pain points change
  const handleCustomerPainPointsChange = (value: string) => {
    setCustomerPainPoints(value);
  };

  // Handle customer pain points blur - save to database
  const handleCustomerPainPointsBlur = () => {
    const painPointsArray = textToArray(customerPainPoints);
    saveBrandData({ redditCustomerPainPoints: painPointsArray });
  };

  // Handle customer pain points keydown - auto-add bullet on new line with spacing
  const handleCustomerPainPointsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      setCustomerPainPoints(newValue);
      
      // Set cursor position after the bullet
      setTimeout(() => {
        const newCursorPos = start + spacing.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
  };

  // Handle purchase triggers change
  const handlePurchaseTriggersChange = (value: string) => {
    setPurchaseTriggers(value);
  };

  // Handle purchase triggers blur - save to database
  const handlePurchaseTriggersBlur = () => {
    const triggersArray = textToArray(purchaseTriggers);
    saveBrandData({ insTriggerEvents: triggersArray });
  };

  // Handle purchase triggers keydown - auto-add bullet on new line with spacing
  const handlePurchaseTriggersKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      setPurchaseTriggers(newValue);
      
      // Set cursor position after the bullet
      setTimeout(() => {
        const newCursorPos = start + spacing.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
  };

  // Handle customer expectations change
  const handleCustomerExpectationsChange = (value: string) => {
    setCustomerExpectations(value);
  };

  // Handle customer expectations blur - save to database
  const handleCustomerExpectationsBlur = () => {
    const expectationsArray = textToArray(customerExpectations);
    saveBrandData({ insAspirations: expectationsArray });
  };

  // Handle customer expectations keydown - auto-add bullet on new line with spacing
  const handleCustomerExpectationsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      setCustomerExpectations(newValue);
      
      // Set cursor position after the bullet
      setTimeout(() => {
        const newCursorPos = start + spacing.length;
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
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
          {/* Row 1: ContentWrapper only */}
          <div className={styles.row}>
            <div className={`${styles.rowContent} ${styles.first}`}>
              <ContentWrapper
                brandName={brandData.name}
                logoUrl={logoUrl}
                onLogoUpload={handleLogoUpload}
                isUploadingLogo={isUploadingLogo}
              />
            </div>
          </div>

          {/* Row 2: Target Customer (left) + Purchase Triggers (right) */}
          <div className={styles.row}>
            {/* Left Column: Target Customer */}
            <div className={styles.rowContent}>
              <Label className={styles.label}>
                Target customer
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonInput} />
              ) : (
                <div className={styles.tagsContainer}>
                  {targetCustomers.length > 0 && (
                    <div className={styles.tagsList}>
                      {targetCustomers.map((customer, index) => (
                        <div key={index} className={styles.tagChip}>
                          <span>{customer}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTargetCustomer(index)}
                            className={styles.tagRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isTargetCustomersFocused || targetCustomers.length === 0 ? (
                    <div className={styles.tagInputWrapper}>
                      <input
                        type="text"
                        value={targetCustomersInput}
                        onChange={(e) => setTargetCustomersInput(e.target.value)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (!targetCustomersInput.trim()) {
                              setIsTargetCustomersFocused(false);
                            }
                          }, 200);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTargetCustomer();
                          }
                          if (e.key === 'Escape') {
                            setIsTargetCustomersFocused(false);
                            setTargetCustomersInput('');
                          }
                        }}
                        placeholder="Enter target customer"
                        className={styles.tagInput}
                        autoFocus={isTargetCustomersFocused}
                      />
                      <button
                        type="button"
                        onClick={handleAddTargetCustomer}
                        className={styles.tagAddButton}
                        disabled={!targetCustomersInput.trim() || targetCustomers.includes(targetCustomersInput.trim())}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.tagsPlaceholder}
                      onClick={() => setIsTargetCustomersFocused(true)}
                    >
                      Click to add target customers
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Purchase Triggers */}
            <div className={styles.rowContent}>
              <Label className={styles.label}>
                Purchase triggers
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <textarea
                  ref={purchaseTriggersInputRef}
                  value={purchaseTriggers}
                  onChange={(e) => handlePurchaseTriggersChange(e.target.value)}
                  onBlur={handlePurchaseTriggersBlur}
                  onKeyDown={handlePurchaseTriggersKeyDown}
                  onFocus={(e) => {
                    // If textarea is empty, add bullet point
                    if (!e.target.value.trim()) {
                      setPurchaseTriggers('• ');
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = 2;
                      }, 0);
                    }
                  }}
                  placeholder="• Tell us why people buy your product"
                  className={styles.textarea}
                  rows={6}
                />
              )}
            </div>
          </div>

          {/* Row 3: Customer Pain Points (left) + Customer Expectations (right) */}
          <div className={styles.row}>
            {/* Left Column: Customer Pain Points */}
            <div className={styles.rowContent}>
              <Label className={styles.label}>
                Customer pain points
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <textarea
                  ref={customerPainPointsInputRef}
                  value={customerPainPoints}
                  onChange={(e) => handleCustomerPainPointsChange(e.target.value)}
                  onBlur={handleCustomerPainPointsBlur}
                  onKeyDown={handleCustomerPainPointsKeyDown}
                  onFocus={(e) => {
                    // If textarea is empty, add bullet point
                    if (!e.target.value.trim()) {
                      setCustomerPainPoints('• ');
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = 2;
                      }, 0);
                    }
                  }}
                  placeholder="• Enter customer pain points"
                  className={styles.textarea}
                  rows={6}
                />
              )}
            </div>

            {/* Right Column: Customer Expectations */}
            <div className={styles.rowContent}>
              <Label className={styles.label}>
                Customer expectations
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <textarea
                  ref={customerExpectationsInputRef}
                  value={customerExpectations}
                  onChange={(e) => handleCustomerExpectationsChange(e.target.value)}
                  onBlur={handleCustomerExpectationsBlur}
                  onKeyDown={handleCustomerExpectationsKeyDown}
                  onFocus={(e) => {
                    // If textarea is empty, add bullet point
                    if (!e.target.value.trim()) {
                      setCustomerExpectations('• ');
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = 2;
                      }, 0);
                    }
                  }}
                  placeholder="• Tell us what customers expect from your product"
                  className={styles.textarea}
                  rows={6}
                />
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
