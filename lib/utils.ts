import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Returns the same calendar day at 23:59:59.999 so that "To" date filters include the full day.
 */
export function toEndOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a website URL for consistent comparison.
 * Trims, lowercases, adds https:// if no protocol, removes trailing slash.
 */
export function normalizeWebsiteUrl(url: string): string {
  let u = url.trim().toLowerCase();
  if (!u) return u;
  if (!/^https?:\/\//i.test(u)) {
    u = 'https://' + u;
  }
  return u.replace(/\/+$/, '');
}

/**
 * Extracts the GA client ID from the _ga cookie.
 * Cookie format: GA1.2.123456789.987654321 → returns "123456789.987654321"
 */
export function getGaClientId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Computes SHA-256 hash of lowercase(trim(email)) using the Web Crypto API.
 * Returns hex string, e.g. "abc123..."
 */
export async function hashEmailSha256(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derives the storage key from a Vercel Blob (or similar) public URL.
 * Uses the pathname without leading slash, e.g. "clone/ps9.webp".
 * Returns null if the URL cannot be parsed.
 */
export function getStorageKeyFromBlobUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/^\/+/, '');
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
