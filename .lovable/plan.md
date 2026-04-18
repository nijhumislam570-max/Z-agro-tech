

# Z Agro Tech — Phase 1 Plan

A full pivot from VetMedix to **Z Agro Tech**: an agriculture e-commerce store + LMS academy. Phase 1 builds the UI shells, routing, and data schema. No payments or video streaming yet.

## What gets removed (Phase 1)

All pet/vet/clinic/social surfaces are stripped from the user-facing app:

- **Pages deleted:** Feed, Explore, Pets, Clinics, Doctors, Messages, Notifications, Book Appointment, Track Order, Wishlist, Doctor/Clinic dashboards, Blog, all clinic/doctor verification pages, social/CMS admin pages.
- **Components deleted:** Social (posts, stories, comments), pet cards, clinic/doctor components, support chat widget, notification bell, pet context.
- **Routes removed** from `App.tsx`. Admin shell stays (rebranded) for product/order/customer management.
- **DB tables left in place** (no destructive migration) — they simply become orphan/inactive. We only *add* new tables.

## What gets built

### 1. Branding & Logo
- Save uploaded logo to `src/assets/zagrotech-logo.jpeg`.
- Update `src/components/Logo.tsx` → text becomes "Z Agro Tech", subtitle "Cultivating Innovation".
- Recolor theme in `src/index.css` + `tailwind.config.ts` to **earthy green palette** (deep forest green primary, sage accent, warm cream background, charcoal text). Replace coral/peach tokens.
- Update `index.html` title + meta. Update `Footer.tsx` copy.

### 2. New routes (added to `App.tsx`)

```text
/              → Home (bento-grid: hero + featured products + featured courses)
/shop          → Product listing (reuses existing products table, filtered by category)
/product/:id   → Product detail (kept, restyled)
/cart, /checkout → Kept (existing flow works)
/academy       → Course listing
/course/:id    → Course detail (enroll button — Phase 2 will wire payment)
/dashboard     → Tabs: "My Orders" | "My Courses" (replaces /profile for end users)
/auth          → Kept
/admin/*       → Kept (rebranded), plus new /admin/courses CRUD
```

### 3. New components

```text
src/components/
  Navbar.tsx                  ← rewritten: Logo, Shop, Academy, Cart, Dashboard, Sign In
  Footer.tsx                  ← rewritten with Z Agro Tech copy
  home/
    HeroSection.tsx           ← glassmorphism hero, green gradient
    FeaturedProductsGrid.tsx  ← bento grid (3-col @container)
    FeaturedCoursesGrid.tsx   ← bento grid (3-col @container)
  shop/
    ProductCard.tsx           ← restyled: Card + Badge for stock status
    ProductGrid.tsx
    ProductSkeleton.tsx
  academy/
    CourseCard.tsx            ← Card + Badge for difficulty (Beginner/Intermediate/Advanced)
    CourseGrid.tsx
    CourseSkeleton.tsx
  dashboard/
    OrdersTab.tsx
    CoursesTab.tsx
```

### 4. New pages

```text
src/pages/
  Index.tsx                ← rewritten Home
  ShopPage.tsx             ← rewritten (agri products)
  ProductDetailPage.tsx    ← restyled
  AcademyPage.tsx          ← NEW
  CourseDetailPage.tsx     ← NEW
  DashboardPage.tsx        ← NEW (Tabs)
  admin/AdminCourses.tsx   ← NEW (basic course CRUD)
```

### 5. New hooks

```text
src/hooks/
  useCourses.ts        ← list + single course fetch (React Query, Skeleton states)
  useEnrollments.ts    ← list user's enrollments, enroll mutation
  useMyOrders.ts       ← thin wrapper over orders table for the dashboard
```

### 6. Database (Supabase migration)

**New tables only — no destructive changes:**

```text
courses
  id uuid pk, title text, description text, price numeric,
  thumbnail_url text, video_url text, instructor_id uuid → auth.users,
  difficulty text ('beginner'|'intermediate'|'advanced'),
  is_active bool default true, created_at, updated_at

enrollments
  id uuid pk, user_id uuid → auth.users, course_id uuid → courses,
  enrolled_at timestamptz, progress int default 0,
  unique(user_id, course_id)
```

**RLS policies:**
- `courses` — public SELECT where `is_active = true`; admin INSERT/UPDATE/DELETE via `has_role(auth.uid(),'admin')`.
- `enrollments` — user SELECT/INSERT/DELETE only where `auth.uid() = user_id`; admin SELECT all.

**Products** — add a category filter (`agriculture-tools`, `seeds`, `fertilizers`, `equipment`). Existing `is_active`/stock columns reused. Existing `orders` + `create_order_with_stock` RPC unchanged.

### 7. Cleanup
- Remove `PetProvider` and unused contexts from `src/App.tsx`.
- Remove `SupportChatLoader`, `MobileNav` (rebuilt minimal) and pet/clinic/doctor guards from routing.
- Leave the underlying tables and edge functions in place to avoid breaking restoration; they just become unreferenced.

## Layout note
There is no existing global `Layout.tsx` — each page mounts its own Navbar + Footer. New pages will follow the same convention so we don't introduce a new wrapper.

## Out of scope (Phase 2+)
Payment gateways, video streaming/player, course progress tracking logic, instructor portal, course reviews, certificates.

## File-change summary

```text
ADD     src/assets/zagrotech-logo.jpeg
MODIFY  src/components/Logo.tsx, Navbar.tsx, Footer.tsx
MODIFY  src/index.css, tailwind.config.ts, index.html
MODIFY  src/App.tsx  (routes pruned + new routes)
MODIFY  src/pages/Index.tsx, ShopPage.tsx, ProductDetailPage.tsx
ADD     src/pages/AcademyPage.tsx, CourseDetailPage.tsx, DashboardPage.tsx
ADD     src/pages/admin/AdminCourses.tsx
ADD     src/components/{home,shop,academy,dashboard}/*
ADD     src/hooks/useCourses.ts, useEnrollments.ts, useMyOrders.ts
DELETE  pet/clinic/doctor/social pages, components, hooks, contexts
DB      migration: create courses + enrollments tables with RLS
```

