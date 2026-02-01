export interface AdImage {
  id: string;
  title: string | null;
  publicUrl: string;
  width: number;
  height: number;
  format: string;
  createdAt: Date | string;
  deleteAt?: Date | string | null;
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

export { CONTENT_LIBRARY_DELETE_GRACE_DAYS } from "@/lib/constants/content-library";

export const archetypes = [
  { code: "all", name: "All" },
  { code: "problem_solution", name: "Problem-Solution" },
  { code: "testimonial", name: "Testimonial" },
  { code: "competitor_comparison", name: "Competitor Comparison" },
  { code: "promotion_offer", name: "Promotion (Offer)" },
  { code: "value_proposition", name: "Value Proposition" },
  { code: "meme", name: "Meme" },
];

export const formats = [
  { code: "all", name: "All" },
  { code: "1:1", name: "1:1" },
  { code: "9:16", name: "9:16" },
];
export type ArchetypeCode = typeof archetypes[number]['code'];

export function getArchetypeName(code: ArchetypeCode): string {
  const found = archetypes.find(a => a.code === code);
  if (!found) {
    return "Unknown";
  }
  return found.name;
}