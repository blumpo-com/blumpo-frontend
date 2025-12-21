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
  const [customerPainPoints, setCustomerPainPoints] = useState<string[]>([]);
  const [customerPainPointsInput, setCustomerPainPointsInput] = useState('');
  const [isCustomerPainPointsFocused, setIsCustomerPainPointsFocused] = useState(false);
  const [purchaseTriggers, setPurchaseTriggers] = useState<string[]>([]);
  const [purchaseTriggersInput, setPurchaseTriggersInput] = useState('');
  const [isPurchaseTriggersFocused, setIsPurchaseTriggersFocused] = useState(false);
  const [customerExpectations, setCustomerExpectations] = useState<string[]>([]);
  const [customerExpectationsInput, setCustomerExpectationsInput] = useState('');
  const [isCustomerExpectationsFocused, setIsCustomerExpectationsFocused] = useState(false);
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
      setCustomerPainPoints(Array.isArray(brandData.insights?.redditCustomerPainPoints) ? brandData.insights.redditCustomerPainPoints : []);
      setPurchaseTriggers(Array.isArray(brandData.insights?.insTriggerEvents) ? brandData.insights.insTriggerEvents : []);
      setCustomerExpectations(Array.isArray(brandData.insights?.insAspirations) ? brandData.insights.insAspirations : []);
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

  // Handle customer pain points - add from textarea (bullet points)
  const handleCustomerPainPointsBlur = () => {
    if (customerPainPointsInput.trim()) {
      // Split by newlines and filter empty
      const painPoints = customerPainPointsInput
        .split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0);
      
      if (painPoints.length > 0) {
        const newPainPoints = [...customerPainPoints, ...painPoints];
        setCustomerPainPoints(newPainPoints);
        setCustomerPainPointsInput('');
        setIsCustomerPainPointsFocused(false);
        saveBrandData({ customerPainPoints: newPainPoints });
      }
    }
  };

  // Remove customer pain point
  const handleRemoveCustomerPainPoint = (index: number) => {
    const newPainPoints = customerPainPoints.filter((_, i) => i !== index);
    setCustomerPainPoints(newPainPoints);
    saveBrandData({ customerPainPoints: newPainPoints });
  };

  // Handle purchase triggers - add from textarea (bullet points)
  const handlePurchaseTriggersBlur = () => {
    if (purchaseTriggersInput.trim()) {
      // Split by newlines and filter empty
      const triggers = purchaseTriggersInput
        .split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0);
      
      if (triggers.length > 0) {
        const newTriggers = [...purchaseTriggers, ...triggers];
        setPurchaseTriggers(newTriggers);
        setPurchaseTriggersInput('');
        setIsPurchaseTriggersFocused(false);
        saveBrandData({ insTriggerEvents: newTriggers });
      }
    }
  };

  // Remove purchase trigger
  const handleRemovePurchaseTrigger = (index: number) => {
    const newTriggers = purchaseTriggers.filter((_, i) => i !== index);
    setPurchaseTriggers(newTriggers);
    saveBrandData({ insTriggerEvents: newTriggers });
  };

  // Handle customer expectations - add from textarea (bullet points)
  const handleCustomerExpectationsBlur = () => {
    if (customerExpectationsInput.trim()) {
      // Split by newlines and filter empty
      const expectations = customerExpectationsInput
        .split('\n')
        .map(line => line.trim().replace(/^[•\-\*]\s*/, '')) // Remove bullet points
        .filter(line => line.length > 0);
      
      if (expectations.length > 0) {
        const newExpectations = [...customerExpectations, ...expectations];
        setCustomerExpectations(newExpectations);
        setCustomerExpectationsInput('');
        setIsCustomerExpectationsFocused(false);
        saveBrandData({ insAspirations: newExpectations });
      }
    }
  };

  // Remove customer expectation
  const handleRemoveCustomerExpectation = (index: number) => {
    const newExpectations = customerExpectations.filter((_, i) => i !== index);
    setCustomerExpectations(newExpectations);
    saveBrandData({ insAspirations: newExpectations });
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

            {/* Target Customer */}
            <div>
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

            {/* Customer Pain Points */}
            <div>
              <Label className={styles.label}>
                Customer pain points
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <div className={styles.painPointsContainer}>
                  {customerPainPoints.length > 0 && (
                    <div className={styles.painPointsList}>
                      {customerPainPoints.map((painPoint, index) => (
                        <div key={index} className={styles.painPointChip}>
                          <span>{painPoint}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomerPainPoint(index)}
                            className={styles.painPointRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isCustomerPainPointsFocused || customerPainPoints.length === 0 ? (
                    <textarea
                      ref={customerPainPointsInputRef}
                      value={customerPainPointsInput}
                      onChange={(e) => setCustomerPainPointsInput(e.target.value)}
                      onBlur={handleCustomerPainPointsBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsCustomerPainPointsFocused(false);
                          setCustomerPainPointsInput('');
                        }
                      }}
                      placeholder="• Enter customer pain points"
                      className={styles.textarea}
                      rows={4}
                    />
                  ) : (
                    <div
                      className={styles.painPointsPlaceholder}
                      onClick={() => {
                        setIsCustomerPainPointsFocused(true);
                        setTimeout(() => customerPainPointsInputRef.current?.focus(), 0);
                      }}
                    >
                      {customerPainPoints.length === 0 ? 'Click to add customer pain points' : 'Click to add more pain points'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.column}>
            {/* Purchase Triggers */}
            <div>
              <Label className={styles.label}>
                Purchase triggers
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <div className={styles.triggersContainer}>
                  {purchaseTriggers.length > 0 && (
                    <div className={styles.triggersList}>
                      {purchaseTriggers.map((trigger, index) => (
                        <div key={index} className={styles.triggerChip}>
                          <span>{trigger}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePurchaseTrigger(index)}
                            className={styles.triggerRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isPurchaseTriggersFocused || purchaseTriggers.length === 0 ? (
                    <textarea
                      ref={purchaseTriggersInputRef}
                      value={purchaseTriggersInput}
                      onChange={(e) => setPurchaseTriggersInput(e.target.value)}
                      onBlur={handlePurchaseTriggersBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsPurchaseTriggersFocused(false);
                          setPurchaseTriggersInput('');
                        }
                      }}
                      placeholder="• Tell us why people buy your product"
                      className={styles.textarea}
                      rows={4}
                    />
                  ) : (
                    <div
                      className={styles.triggersPlaceholder}
                      onClick={() => {
                        setIsPurchaseTriggersFocused(true);
                        setTimeout(() => purchaseTriggersInputRef.current?.focus(), 0);
                      }}
                    >
                      {purchaseTriggers.length === 0 ? 'Click to add purchase triggers' : 'Click to add more triggers'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Expectations */}
            <div>
              <Label className={styles.label}>
                Customer expectations
              </Label>
              {!insightsLoaded ? (
                <div className={styles.skeletonTextarea} />
              ) : (
                <div className={styles.expectationsContainer}>
                  {customerExpectations.length > 0 && (
                    <div className={styles.expectationsList}>
                      {customerExpectations.map((expectation, index) => (
                        <div key={index} className={styles.expectationChip}>
                          <span>{expectation}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomerExpectation(index)}
                            className={styles.expectationRemoveButton}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {isCustomerExpectationsFocused || customerExpectations.length === 0 ? (
                    <textarea
                      ref={customerExpectationsInputRef}
                      value={customerExpectationsInput}
                      onChange={(e) => setCustomerExpectationsInput(e.target.value)}
                      onBlur={handleCustomerExpectationsBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsCustomerExpectationsFocused(false);
                          setCustomerExpectationsInput('');
                        }
                      }}
                      placeholder="• Tell us what customers expect from your product"
                      className={styles.textarea}
                      rows={4}
                    />
                  ) : (
                    <div
                      className={styles.expectationsPlaceholder}
                      onClick={() => {
                        setIsCustomerExpectationsFocused(true);
                        setTimeout(() => customerExpectationsInputRef.current?.focus(), 0);
                      }}
                    >
                      {customerExpectations.length === 0 ? 'Click to add customer expectations' : 'Click to add more expectations'}
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
