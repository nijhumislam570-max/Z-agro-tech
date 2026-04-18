/**
 * Media Compression Utilities
 * Client-side image and video optimization for fast loading
 */

import { logger } from '@/lib/logger';

export interface CompressionSettings {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

export interface CompressedMedia {
  file: File;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  thumbnailDataUrl?: string;
  compressionRatio: number;
}

export const COMPRESSION_PRESETS: Record<string, CompressionSettings> = {
  feed: { maxWidth: 1920, maxHeight: 1920, quality: 0.85 },
  story: { maxWidth: 1080, maxHeight: 1920, quality: 0.75 },
  avatar: { maxWidth: 400, maxHeight: 400, quality: 0.8 },
  thumbnail: { maxWidth: 50, maxHeight: 50, quality: 0.6 },
  product: { maxWidth: 1200, maxHeight: 1200, quality: 0.85 },
  clinic: { maxWidth: 1600, maxHeight: 1200, quality: 0.8 },
  medical: { maxWidth: 3000, maxHeight: 3000, quality: 0.95 },
};

/**
 * Check if browser supports modern image compression APIs
 */
const supportsImageBitmap = typeof createImageBitmap !== 'undefined';
const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Compress an image file
 */
export async function compressImage(
  file: File,
  preset: keyof typeof COMPRESSION_PRESETS = 'feed'
): Promise<CompressedMedia> {
  const settings = COMPRESSION_PRESETS[preset];
  const originalSize = file.size;

  // If file is already small enough (<100KB), skip compression
  if (originalSize < 100 * 1024 && preset !== 'thumbnail') {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      width: 0,
      height: 0,
      compressionRatio: 1,
    };
  }

  try {
    // Create image bitmap for efficient decoding
    let imageBitmap: ImageBitmap;
    
    if (supportsImageBitmap) {
      imageBitmap = await createImageBitmap(file);
    } else {
      // Fallback for older browsers
      const img = await loadImage(file);
      imageBitmap = await createImageBitmap(img);
    }

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      imageBitmap.width,
      imageBitmap.height,
      settings.maxWidth,
      settings.maxHeight
    );

    // Create canvas for compression
    let canvas: HTMLCanvasElement | OffscreenCanvas;
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

    if (supportsOffscreenCanvas) {
      canvas = new OffscreenCanvas(width, height);
      ctx = canvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d');
    }

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw image with smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    // Convert to blob - try WebP first, fallback to JPEG
    let blob: Blob;
    let mimeType = 'image/webp';

    if (supportsOffscreenCanvas && canvas instanceof OffscreenCanvas) {
      try {
        blob = await canvas.convertToBlob({ type: 'image/webp', quality: settings.quality });
      } catch {
        blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: settings.quality });
        mimeType = 'image/jpeg';
      }
    } else {
      // HTMLCanvas fallback
      const htmlCanvas = canvas as HTMLCanvasElement;
      blob = await new Promise<Blob>((resolve, reject) => {
        htmlCanvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
          'image/webp',
          settings.quality
        );
      }).catch(() => {
        mimeType = 'image/jpeg';
        return new Promise<Blob>((resolve, reject) => {
          htmlCanvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
            'image/jpeg',
            settings.quality
          );
        });
      });
    }

    // Generate thumbnail if not already thumbnail preset
    let thumbnailDataUrl: string | undefined;
    if (preset !== 'thumbnail') {
      const thumbnailResult = await generateThumbnail(file);
      thumbnailDataUrl = thumbnailResult;
    }

    // Create new file with compressed data
    const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const newFileName = file.name.replace(/\.[^.]+$/, `.${extension}`);
    const compressedFile = new File([blob], newFileName, { type: mimeType });

    // Clean up
    imageBitmap.close();

    return {
      file: compressedFile,
      originalSize,
      compressedSize: blob.size,
      width,
      height,
      thumbnailDataUrl,
      compressionRatio: originalSize / blob.size,
    };
  } catch (error) {
    logger.error('Image compression failed, using original:', error);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      width: 0,
      height: 0,
      compressionRatio: 1,
    };
  }
}

/**
 * Generate a tiny thumbnail for progressive loading
 */
export async function generateThumbnail(file: File, size: number = 50): Promise<string> {
  try {
    const imageBitmap = await createImageBitmap(file);
    
    const aspectRatio = imageBitmap.width / imageBitmap.height;
    const width = aspectRatio > 1 ? size : Math.round(size * aspectRatio);
    const height = aspectRatio > 1 ? Math.round(size / aspectRatio) : size;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No context');

    ctx.drawImage(imageBitmap, 0, 0, width, height);
    imageBitmap.close();

    return canvas.toDataURL('image/jpeg', 0.5);
  } catch {
    return '';
  }
}

/**
 * Extract poster frame from video
 */
export async function extractVideoPoster(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 0.1; // Seek to 0.1s to get first real frame
    };

    video.onseeked = () => {
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve('');
      }
      
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      resolve('');
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Load image from file (fallback for older browsers)
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate and optimize media file
 */
export async function validateAndOptimizeMedia(
  file: File,
  context: 'feed' | 'story' | 'avatar' | 'product' | 'clinic' | 'medical' = 'feed'
): Promise<{ file: File; thumbnail?: string; poster?: string; stats: CompressedMedia | null }> {
  // Hard 10MB limit for medical uploads
  if (context === 'medical' && file.size > 10 * 1024 * 1024) {
    throw new Error('Medical images must be under 10MB');
  }
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (isImage) {
    const result = await compressImage(file, context);
    return {
      file: result.file,
      thumbnail: result.thumbnailDataUrl,
      stats: result,
    };
  }

  if (isVideo) {
    const poster = await extractVideoPoster(file);
    return {
      file, // Videos are not re-encoded client-side
      poster,
      stats: null,
    };
  }

  return { file, stats: null };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Calculate compression savings message
 */
export function getCompressionMessage(original: number, compressed: number): string {
  const saved = original - compressed;
  const percentage = Math.round((saved / original) * 100);
  return `Compressed ${formatBytes(original)} → ${formatBytes(compressed)} (${percentage}% smaller)`;
}
