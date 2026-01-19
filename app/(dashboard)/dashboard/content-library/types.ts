export interface AdImage {
  id: string;
  title: string | null;
  publicUrl: string;
  width: number;
  height: number;
  format: string;
  createdAt: Date | string;
  isDeleted?: boolean;
  brand: {
    id: string | null;
    name: string | null;
    websiteUrl: string | null;
  } | null;
  job: {
    id: string;
    status: string;
    archetypeCode: string | null;
    archetypeMode: string | null;
    createdAt: Date | string;
  } | null;
  workflow: {
    id: string;
    archetypeCode: string;
    variantKey: string;
  } | null;
}

export interface ContentLibraryResponse {
  images: AdImage[];
  total: number;
}
