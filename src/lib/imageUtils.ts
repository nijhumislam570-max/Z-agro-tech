/**
 * Image optimization utilities for Supabase storage URLs
 * Appends transform parameters for server-side resizing
 */

const SUPABASE_STORAGE_PATTERN = /supabase\.co\/storage\/v1\/object\/public\//;

export type ImagePreset = 'thumbnail' | 'medium' | 'full' | 'avatar';

const PRESETS: Record<ImagePreset, { width: number; quality: number }> = {
  thumbnail: { width: 300, quality: 75 },
  medium: { width: 800, quality: 80 },
  full: { width: 1600, quality: 85 },
  avatar: { width: 400, quality: 80 },
};

/**
 * Returns an optimized URL for Supabase storage images.
 * For non-Supabase URLs, returns the original URL unchanged.
 */
export function getOptimizedUrl(
  url: string | null | undefined,
  preset: ImagePreset = 'thumbnail'
): string {
  if (!url) return '';
  
  // Only transform Supabase storage URLs
  if (!SUPABASE_STORAGE_PATTERN.test(url)) return url;
  
  const { width, quality } = PRESETS[preset];
  
  // Strip existing transform params
  const baseUrl = url.split('?')[0];
  
  return `${baseUrl}?width=${width}&quality=${quality}`;
}

/**
 * Route prefetch map - lazy import functions for each route
 */
const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  '/feed': () => import('@/pages/FeedPage'),
  '/explore': () => import('@/pages/ExplorePage'),
  '/shop': () => import('@/pages/ShopPage'),
  '/clinics': () => import('@/pages/ClinicsPage'),
  '/doctors': () => import('@/pages/DoctorsPage'),
  '/cart': () => import('@/pages/CartPage'),
  '/profile': () => import('@/pages/ProfilePage'),
  '/messages': () => import('@/pages/MessagesPage'),
  '/notifications': () => import('@/pages/NotificationsPage'),
  '/wishlist': () => import('@/pages/WishlistPage'),
  '/admin': () => import('@/pages/admin/AdminDashboard'),
  '/admin/analytics': () => import('@/pages/admin/AdminAnalytics'),
  '/admin/products': () => import('@/pages/admin/AdminProducts'),
  '/admin/orders': () => import('@/pages/admin/AdminOrders'),
  '/admin/ecommerce-customers': () => import('@/pages/admin/AdminEcommerceCustomers'),
  '/admin/coupons': () => import('@/pages/admin/AdminCoupons'),
  '/admin/delivery-zones': () => import('@/pages/admin/AdminDeliveryZones'),
  '/admin/incomplete-orders': () => import('@/pages/admin/AdminIncompleteOrders'),
  '/admin/recovery-analytics': () => import('@/pages/admin/AdminRecoveryAnalytics'),
  '/admin/clinics': () => import('@/pages/admin/AdminClinics'),
  '/admin/doctors': () => import('@/pages/admin/AdminDoctors'),
  '/admin/social': () => import('@/pages/admin/AdminSocial'),
  '/admin/customers': () => import('@/pages/admin/AdminCustomers'),
  '/admin/messages': () => import('@/pages/admin/AdminContactMessages'),
  '/admin/settings': () => import('@/pages/admin/AdminSettings'),
  '/doctor/dashboard': () => import('@/pages/doctor/DoctorDashboard'),
  '/clinic/dashboard': () => import('@/pages/clinic/ClinicDashboard'),
  '/about': () => import('@/pages/AboutPage'),
  '/contact': () => import('@/pages/ContactPage'),
  '/faq': () => import('@/pages/FAQPage'),
};

const prefetchedRoutes = new Set<string>();

/**
 * Prefetch a route's JS chunk on hover/touch.
 * Idempotent — only fetches once per session.
 */
export function prefetchRoute(path: string): void {
  // Normalize path to match keys
  const key = Object.keys(routePrefetchMap).find(
    (k) => path === k || path.startsWith(k + '/')
  );
  if (!key || prefetchedRoutes.has(key)) return;
  prefetchedRoutes.add(key);
  routePrefetchMap[key]();
}
