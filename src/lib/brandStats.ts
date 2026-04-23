/**
 * Single source of truth for marketing stats shown across `/` and `/about`.
 * Keep these aligned — they appear in the hero pill row on Home and the
 * stats strip on About. Update one place, both pages stay consistent.
 */
export const BRAND_STATS = {
  farmers: { value: '5,000+', label: 'Active Farmers' },
  products: { value: '500+', label: 'Premium Products' },
  courses: { value: '50+', label: 'Expert Courses' },
  satisfaction: { value: '98%', label: 'Satisfaction' },
  districts: { value: '64', label: 'Districts Served' },
} as const;
