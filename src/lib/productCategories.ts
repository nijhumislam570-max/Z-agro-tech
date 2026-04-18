/**
 * Product category enum for Z Agro Tech.
 * Use this single source of truth for typed category fields,
 * Zod validation, CSV/PDF imports, and admin UI options.
 */
export const PRODUCT_CATEGORIES = ['Crops', 'Livestock', 'Fertilizer', 'Equipment'] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const PRODUCT_CATEGORY_OPTIONS: Array<{ value: ProductCategory; label: string }> = [
  { value: 'Crops', label: 'Crops & Seeds' },
  { value: 'Livestock', label: 'Livestock & Feed' },
  { value: 'Fertilizer', label: 'Fertilizer & Soil' },
  { value: 'Equipment', label: 'Tools & Equipment' },
];
