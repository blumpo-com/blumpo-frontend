import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
