import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Extracts the storage path from a full Supabase public URL.
 * E.g., "https://xxx.supabase.co/storage/v1/object/public/pet-media/user-id/avatars/123.webp"
 * returns "user-id/avatars/123.webp"
 */
export function extractStoragePath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.substring(idx + marker.length));
  } catch {
    return null;
  }
}

/**
 * Removes files from a storage bucket given their full public URLs.
 * Silently skips URLs that don't match the bucket pattern.
 */
export async function removeStorageFiles(urls: string[], bucket = 'pet-media'): Promise<void> {
  const paths = urls
    .map((url) => extractStoragePath(url, bucket))
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    logger.error('Failed to remove storage files:', error);
  }
}

/**
 * Generates a signed URL for a private bucket document.
 * Accepts either a storage path or a full public URL (extracts path automatically).
 * Returns null if the path is invalid or signing fails.
 */
export async function getSignedUrl(
  pathOrUrl: string,
  bucket: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  try {
    // If it looks like a full URL, extract the path
    let storagePath = pathOrUrl;
    if (pathOrUrl.startsWith('http')) {
      const extracted = extractStoragePath(pathOrUrl, bucket);
      if (!extracted) return null;
      storagePath = extracted;
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      logger.error('Failed to create signed URL:', error);
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** Allowed MIME types for document uploads (verification documents) */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

/** Allowed MIME type prefix for image-only uploads */
export const IMAGE_MIME_PREFIX = 'image/';

/** Maximum file sizes */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validates a file for image uploads. Returns error message or null if valid.
 */
export function validateImageFile(file: File, maxSize = MAX_IMAGE_SIZE): string | null {
  if (!file.type.startsWith(IMAGE_MIME_PREFIX)) {
    return 'Please select a valid image file';
  }
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    return `Image size must be less than ${sizeMB}MB`;
  }
  return null;
}

/**
 * Validates a file for document uploads (PDF, images). Returns error message or null if valid.
 */
export function validateDocumentFile(file: File, maxSize = MAX_DOCUMENT_SIZE): string | null {
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return 'Only PDF or image files (JPG, PNG, WebP) are allowed';
  }
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    return `File size must be less than ${sizeMB}MB`;
  }
  return null;
}
