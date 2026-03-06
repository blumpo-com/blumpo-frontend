export interface CloneAd {
  id: string;
  workflowId: string;
  storageUrl: string | null;
  archetypeCode: string;
  variantKey: string;
  format: string | null;
}

export interface CloneAdsResponse {
  clones: CloneAd[];
}
