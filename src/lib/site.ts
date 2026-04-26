const FALLBACK_SITE_URL = 'https://zagrotech.vercel.app';

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

export const getSiteUrl = () => {
  const configured = import.meta.env.VITE_SITE_URL;
  if (configured && configured.trim()) {
    return normalizeBaseUrl(configured);
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return normalizeBaseUrl(window.location.origin);
  }

  return FALLBACK_SITE_URL;
};

export const toAbsoluteUrl = (value?: string | null) => {
  if (!value) return undefined;

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('data:')
  ) {
    return value;
  }

  const base = `${getSiteUrl()}/`;
  const path = value.startsWith('/') ? value : `/${value}`;
  return new URL(path, base).toString();
};

export const getSupabaseSitemapUrl = () =>
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sitemap`;
