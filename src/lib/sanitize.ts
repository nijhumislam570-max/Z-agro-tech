/**
 * Input sanitization utilities for user-generated content
 * Prevents XSS attacks and ensures consistent text formatting
 */

// Characters that could be used for XSS attacks
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
  /data:\s*text\/html/gi,
  /<embed\b/gi,
  /<object\b/gi,
  /<link\b/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
];

// HTML entities for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escapes HTML special characters to prevent XSS
 * Use this for text that will be rendered as HTML
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Removes dangerous HTML/script content from text
 * Use this for user-generated content that shouldn't contain any HTML
 */
export function stripDangerousContent(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let sanitized = text;
  
  // Remove all XSS patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Remove any remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  return sanitized;
}

/**
 * Sanitizes text for display - removes dangerous content and normalizes whitespace
 * Use this for post content, comments, messages, reviews
 */
export function sanitizeText(text: string, options: {
  maxLength?: number;
  allowNewlines?: boolean;
  trim?: boolean;
} = {}): string {
  const { maxLength, allowNewlines = true, trim = true } = options;
  
  if (!text || typeof text !== 'string') return '';
  
  let sanitized = stripDangerousContent(text);
  
  // Normalize whitespace
  if (allowNewlines) {
    // Collapse multiple newlines to max 2
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
    // Collapse multiple spaces
    sanitized = sanitized.replace(/[ \t]+/g, ' ');
  } else {
    // Replace all whitespace with single space
    sanitized = sanitized.replace(/\s+/g, ' ');
  }
  
  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }
  
  // Enforce max length
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitizes a URL to prevent javascript: and data: protocols
 * Returns empty string for dangerous URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:')
  ) {
    return '';
  }
  
  // Only allow http, https, mailto, and tel protocols
  const hasProtocol = /^[a-z]+:/i.test(url);
  if (hasProtocol) {
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    const protocol = url.slice(0, url.indexOf(':') + 1).toLowerCase();
    if (!allowedProtocols.includes(protocol)) {
      return '';
    }
  }
  
  return url;
}

/**
 * Sanitizes a filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[/\\]/g, '') // Remove slashes
    .replace(/\.\./g, '') // Remove directory traversal
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid Windows chars
    .trim();
}

/**
 * Creates a safe excerpt from text for meta descriptions and previews
 */
export function createExcerpt(text: string, maxLength: number = 160): string {
  const sanitized = sanitizeText(text, { allowNewlines: false, maxLength: maxLength + 50 });
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  // Cut at last word boundary before maxLength
  const truncated = sanitized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Validates that text doesn't contain potentially dangerous content
 * Returns true if the text is safe
 */
export function isTextSafe(text: string): boolean {
  if (!text || typeof text !== 'string') return true;
  
  const lowerText = text.toLowerCase();
  
  // Check for script tags
  if (/<script/i.test(text)) return false;
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(text)) return false;
  
  // Check for javascript: protocol
  if (lowerText.includes('javascript:')) return false;
  
  // Check for data: URLs with text/html
  if (/data:\s*text\/html/i.test(text)) return false;
  
  return true;
}
