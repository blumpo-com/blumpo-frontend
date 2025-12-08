/**
 * Uploads a photo to Vercel Blob and optionally updates the brand's photos array
 * Returns the public URL of the uploaded photo
 */
export async function uploadPhotoAndUpdateGeneration(
  file: File,
  brandId: string,
  jobId: string
): Promise<string> {
  try {
    // Upload to Vercel Blob
    const formData = new FormData();
    formData.append('file', file);
    formData.append('brandId', brandId);

    const uploadResponse = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json();
      throw new Error(error.error || 'Failed to upload photo');
    }

    const { url } = await uploadResponse.json();

    // The upload-photo API already updates the brand's photos array
    // We don't need to update the generation job here as it will be updated
    // by the parent component after this function returns

    return url;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

