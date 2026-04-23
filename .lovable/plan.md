

## Plan: Professional contrast & UI polish for Dashboard

### Root cause (visible in your screenshot)
Every dashboard tile (Recent Orders, Quick Actions, Alerts, Continue Masterclass, Recommended Inputs, Featured Masterclass, Featured Carousel) still uses **`GlassCard`** — a translucent-white component built for the old dark green gradient era. Now that the page background is light beige, you get **white text on white tiles**, ghost headers, and the "washed out" feel in the screenshot. The stat row at the top reads cleanly only because that one was already migrated.

### What I'll change

**1. Replace `GlassCard` with a clean light tile preset** across all 7 dashboard tiles:
- White surface (`bg-card`), soft border (`border-border/60`), `rounded-2xl`, `shadow-sm` → `hover:shadow-md` and `hover:-translate-y-0.5` for depth.
- Section headers: `text-foreground` + iconography in a small `bg-primary/10 text-primary` chip (matches Academy "Academy at a glance" card).
- Subtext: `text-muted-foreground`.
- Empty states: dashed `border-border` on `bg-secondary/40`, `text-muted-foreground` copy, `Button` default primary.

**2. Tile-by-tile token rewrite (no logic changes)**
- `RecentOrdersList`: status badges keep semantic tones; row backgrounds become `bg-secondary/40 hover:bg-secondary/70`; meta text `text-muted-foreground`; price `text-foreground`. "View all" becomes a primary ghost button.
- `QuickActionsTile`: action squares → `bg-secondary/50 hover:bg-secondary` with `bg-primary/10 text-primary` icon chip and `text-foreground` label. Adds proper visible labels and 44px min height.
- `AlertsTile`: alert rows use `*-soft` semantic surfaces (`bg-warning-soft border-warning-border text-warning-foreground`, etc.) per the project's semantic-color memory — readable on light bg.
- `LearningPathTile`: text → foreground/muted; progress bar uses default; CTA = solid primary.
- `RecommendedInputsTile` / `MasterclassTile` / `FeaturedCarouselTile`: card bodies → `bg-card border-border/60`; product titles `text-foreground`; price `text-foreground`; secondary text `text-muted-foreground`; carousel arrows use `bg-card border-border` instead of opaque white-on-white.

**3. Layout polish to match Academy**
- Tighten section spacing; align tile heights with `h-full flex flex-col` so the 8/4 split (Recent Orders + Quick Actions/Alerts column) doesn't visually drift.
- Add a subtle `bg-secondary/30` band behind the BentoGrid section (mirroring Academy's gentle beige zones) to separate it from the hero without feeling heavy.
- Section heading "Your activity" gets the same treatment as Academy section headers (small uppercase eyebrow + bold display title).

**4. Retire `GlassCard` from the dashboard**
- Remove its imports from the 7 tiles (file kept in repo in case used elsewhere — quick search will confirm; if unused, delete it).

### Files to edit
- `src/components/dashboard/RecentOrdersList.tsx`
- `src/components/dashboard/AlertsTile.tsx`
- `src/components/dashboard/tiles/QuickActionsTile.tsx`
- `src/components/dashboard/tiles/LearningPathTile.tsx`
- `src/components/dashboard/tiles/RecommendedInputsTile.tsx`
- `src/components/dashboard/tiles/MasterclassTile.tsx`
- `src/components/dashboard/tiles/FeaturedCarouselTile.tsx`
- `src/pages/DashboardPage.tsx` (small spacing/eyebrow polish on the activity section + soft band behind BentoGrid)
- `src/components/dashboard/GlassCard.tsx` (remove if no other consumer)

### Out of scope (explicitly)
- No backend, query, or business logic changes
- No Bento layout refactor (current 8/4 + 5/7 + 12 split is correct)
- Hero + stat grid stay as you approved them last turn
- No new dependencies

### Expected outcome
Headers like "Recent Orders", "Quick Actions", "Continue your masterclass" become **fully legible** with WCAG-AA contrast. The page reads as one cohesive light, professional surface — the Academy-style aesthetic carried through every tile, no more ghosted glassmorphism over beige.

Reply **"approve"** and I'll execute all edits in one pass.

