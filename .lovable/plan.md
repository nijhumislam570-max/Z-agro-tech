

# Academy Page — Mobile-First UX & Image Visibility Fix

## Root cause (the screenshot)

Two bugs working together:

1. **Container queries silently dead.** `@tailwindcss/container-queries` is **not installed**, but `Index.tsx`, `FeaturedProductsGrid.tsx`, `FeaturedCoursesGrid.tsx` (and the previous Academy version) used `@container` + `@md:grid-cols-2` + `@3xl:grid-cols-3`. Tailwind ignores these → grids collapse to **1 column** at every viewport. That's why the screenshot shows ONE giant card on a 947px desktop.
2. **Thumbnail "Failed to load".** `OptimizedImage` swaps to the error fallback whenever `<img onError>` fires. Many course thumbnails are external URLs (YouTube, sample seeds, etc.) — `getOptimizedUrl('medium')` doesn't change them, but if the URL is broken/CORS-blocked, the whole card area goes grey. There's also no `<source>` srcSet, no eager priority for above-the-fold cards.

## Fix plan (4 surgical edits)

### 1. `src/components/academy/CourseCard.tsx` — robust media + e-commerce-style layout
- Replace `OptimizedImage` for the thumbnail with a self-contained `<img>` block that:
  - uses `loading="lazy"` + `decoding="async"` + explicit `width`/`height` to kill CLS
  - falls back **gracefully** to the gradient + GraduationCap icon on error (current "Failed to load" text is gone)
  - uses `object-cover` with a centered focal point
- Match Shop card density: tighter padding on mobile (`p-3 sm:p-4`), smaller font sizes on `<sm`, condensed badge row (truncate to 2 badges max on mobile, full on desktop).
- Price + CTA row: turn the "View details →" text into a real coloured pill so the tap target is obvious like the Shop's add-to-cart button.

### 2. `src/pages/AcademyPage.tsx` — mobile-first responsive grid + hero
- Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4` with `gap-3 sm:gap-5`.  
  → **2 columns on mobile** (matches Shop's mobile-first density), 3 on tablet/laptop, 4 on widescreen.
- Hero stat strip: shrink to one row on mobile (`grid-cols-3` already), reduce icon + number sizing on `<sm`.
- Search input: full-width on mobile, capped `max-w-md` on `sm+`.
- Category chips: enable horizontal scroll on mobile (`overflow-x-auto flex-nowrap snap-x` + `snap-start` per chip) so all 7 chips stay one-tap accessible without wrapping into 3 rows.
- Add a sticky-on-scroll thin filter bar on mobile (matches Shop pattern) showing active category + reset.

### 3. `src/components/academy/CourseCategoryChips.tsx` — horizontal scroll on mobile
- Switch container from `flex-wrap justify-center` to `flex gap-2 overflow-x-auto snap-x scrollbar-hide pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible`.
- Each chip gets `snap-start shrink-0`.

### 4. Kill the dead `@container` classes site-wide (so homepage grids work too)
- `src/components/home/FeaturedCoursesGrid.tsx`: `@container … @md:grid-cols-2 @3xl:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-3`.
- `src/components/home/FeaturedProductsGrid.tsx`: same swap → `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3` (mobile = 2 cols, matching Shop).
- `src/pages/Index.tsx`: drop `@container` from `<main>` and the value-props section, change value-props grid to `grid-cols-1 md:grid-cols-3`.

## What this delivers

- **Mobile (≤640px):** 2-column course grid with compact cards, horizontal-scroll category chips, full-width search — visually identical density to the Shop page.
- **Tablet (640–1024):** 3-column grid, expanded badges, centred chips.
- **Desktop (≥1280):** 4-column grid for browsing density.
- **Image robustness:** broken/blocked thumbnails fall back to a branded gradient + icon instead of grey "Failed to load" — every card always shows something.
- **Bonus:** homepage Featured Products / Featured Courses also start showing 2–3 columns instead of one tall stack (silent bug fixed in passing).

## Files touched
1. `src/components/academy/CourseCard.tsx`
2. `src/components/academy/CourseCategoryChips.tsx`
3. `src/pages/AcademyPage.tsx`
4. `src/components/home/FeaturedCoursesGrid.tsx`
5. `src/components/home/FeaturedProductsGrid.tsx`
6. `src/pages/Index.tsx`

## Not touched
- Tailwind config (no plugin install — keeping bundle lean).
- `OptimizedImage` (still used elsewhere; we just bypass it for the course thumbnail's hard-fallback case).
- Course data, routes, RLS, hooks.

Reply **"approve"** and I'll execute.

