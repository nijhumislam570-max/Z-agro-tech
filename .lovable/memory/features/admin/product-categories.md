---
name: Product Categories
description: Z Agro product taxonomy — Crops, Livestock, Fertilizer, Equipment
type: feature
---
The Z Agro Tech shop uses four canonical product categories defined in `src/lib/productCategories.ts`:

- **Crops** — seeds, saplings, crop varieties
- **Livestock** — animal feed, supplies for farm animals
- **Fertilizer** — fertilizers, soil amendments, pest/disease control
- **Equipment** — tools, machinery, irrigation hardware

**Single source of truth:** `PRODUCT_CATEGORIES` const + `ProductCategory` type. Used by:
- `src/lib/csvParser.ts` — Zod enum validation for CSV import
- `src/components/admin/PDFImportDialog.tsx` — extracted product typing
- DB table `product_categories` — seeded with these four rows

**Why:** Replaces legacy `'Pet' | 'Farm'` taxonomy from the VET-MEDIX origin codebase.
**How to apply:** When adding new category fields, import from `@/lib/productCategories` rather than hardcoding strings.
