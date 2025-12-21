/**
 * Extract the blob path from a Vercel Blob Storage URL
 * 
 * Example:
 * Input: https://e5f16v1stcwotrmh.public.blob.vercel-storage.com/brand-assets/291422dd-4a26-425a-a9a5-e0e1babeef1b/logo/2025-12-09T18%3A59%3A39.907%2B01%3A00-6S0zIE5SMTvflPHjFT7nUqQdlTzitM.png
 * Output: brand-assets/291422dd-4a26-425a-a9a5-e0e1babeef1b/logo/2025-12-09T18:59:39.907+01:00-6S0zIE5SMTvflPHjFT7nUqQdlTzitM.png
 */
export function extractBlobPathFromUrl(url: string): string | null {
  try {
    // Parse the URL
    const urlObj = new URL(url);
    
    // Extract the pathname (everything after the domain)
    // For Vercel Blob URLs, the path starts after the domain
    // e.g., /brand-assets/.../logo/...
    const pathname = urlObj.pathname;
    
    // Remove leading slash and decode URL encoding
    const decodedPath = decodeURIComponent(pathname.substring(1));
    
    return decodedPath;
  } catch (error) {
    console.error('Error extracting blob path from URL:', error);
    return null;
  }
}
