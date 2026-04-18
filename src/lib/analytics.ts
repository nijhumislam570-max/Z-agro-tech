/**
 * Privacy-respecting analytics and performance monitoring utilities.
 * Tracks Web Vitals and basic usage metrics without collecting PII.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Web Vitals metrics types
interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// Performance thresholds based on Google's Core Web Vitals
const WEB_VITALS_THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value > thresholds.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Report Web Vitals metric to console (development) or analytics service (production)
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    const color = metric.rating === 'good' ? 'green' : metric.rating === 'poor' ? 'red' : 'orange';
    logger.info(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }

  // In production, you could send to an analytics endpoint
  // For now, we'll just track performance metrics locally
  try {
    const storedMetrics = JSON.parse(sessionStorage.getItem('webVitals') || '{}');
    storedMetrics[metric.name] = {
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    };
    sessionStorage.setItem('webVitals', JSON.stringify(storedMetrics));
  } catch {
    // Storage not available
  }
}

/**
 * Initialize Web Vitals monitoring using Performance Observer API
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        reportWebVitals({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
          delta: lastEntry.startTime,
          id: `lcp-${Date.now()}`,
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // LCP not supported
  }

  // Track First Input Delay (FID) / Interaction to Next Paint (INP)
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        const value = fidEntry.processingStart - fidEntry.startTime;
        reportWebVitals({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          delta: value,
          id: `fid-${Date.now()}`,
        });
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // FID not supported
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      });
      reportWebVitals({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        delta: clsValue,
        id: `cls-${Date.now()}`,
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // CLS not supported
  }

  // Track First Contentful Paint (FCP) and Time to First Byte (TTFB)
  try {
    const paintObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          reportWebVitals({
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: `fcp-${Date.now()}`,
          });
        }
      });
    });
    paintObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // Paint timing not supported
  }

  // Track TTFB from navigation timing
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry) {
      const ttfb = navEntry.responseStart - navEntry.requestStart;
      reportWebVitals({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        delta: ttfb,
        id: `ttfb-${Date.now()}`,
      });
    }
  } catch {
    // Navigation timing not available
  }
}

/**
 * Track error for monitoring
 */
export function trackError(error: Error, context?: Record<string, unknown>): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[Error Tracking]', error, context);
    return;
  }

  // In production, you could send to an error tracking service
  // For now, we'll store in session storage for debugging
  try {
    const storedErrors = JSON.parse(sessionStorage.getItem('errorLog') || '[]');
    storedErrors.push({
      message: error.message,
      stack: error.stack?.slice(0, 500),
      context,
      timestamp: Date.now(),
      url: window.location.href,
    });
    // Keep only last 10 errors
    sessionStorage.setItem('errorLog', JSON.stringify(storedErrors.slice(-10)));
  } catch {
    // Storage not available
  }
}

/**
 * Track page view (privacy-respecting - no PII)
 */
export function trackPageView(path: string): void {
  if (import.meta.env.DEV) {
    logger.info('[Analytics] Page view:', path);
  }

  // Store basic page view count in session
  try {
    const pageViews = JSON.parse(sessionStorage.getItem('pageViews') || '{}');
    pageViews[path] = (pageViews[path] || 0) + 1;
    sessionStorage.setItem('pageViews', JSON.stringify(pageViews));
  } catch {
    // Storage not available
  }
}
