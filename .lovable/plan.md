

# Phase 6 — Codebase Cleanup & Strict Scoping

Strip the project to **Shop + LMS + Admin** while preserving the Bento dashboard, auth, cart/checkout, and standard utility pages. All legacy social/clinic/doctor/pet/blog code goes.

## Final route map (App.tsx)

```text
Public:    /  /shop  /product/:id  /academy  /course/:id
           /about  /contact  /faq  /privacy  /terms  /track-order
Auth:      /auth  /forgot-password  /reset-password
User:      /dashboard  (RequireAuth)
           /cart  /checkout  (RequireAuth)
Admin:     /admin · /admin/products · /admin/courses · /admin/orders
           /admin/customers · /admin/ecommerce-customers
           /admin/coupons · /admin/delivery-zones
           /admin/incomplete-orders · /admin/recovery-analytics
           /admin/analytics · /admin/messages · /admin/settings
404:       *
```

Routes removed from App.tsx: none currently registered for legacy pages — App.tsx is already clean. Cleanup is mostly **file deletion** + Navbar/Footer/MobileNav trim + AdminSidebar trim.

## Files to DELETE

### Legacy pages (21)
```
src/pages/FeedPage.tsx
src/pages/ExplorePage.tsx
src/pages/BlogPage.tsx
src/pages/BlogArticlePage.tsx
src/pages/ChatPage.tsx
src/pages/MessagesPage.tsx
src/pages/NotificationsPage.tsx
src/pages/ClinicsPage.tsx
src/pages/ClinicDetailPage.tsx
src/pages/DoctorsPage.tsx
src/pages/DoctorDetailPage.tsx
src/pages/BookAppointmentPage.tsx
src/pages/PetProfilePage.tsx
src/pages/CreatePetPage.tsx
src/pages/EditPetPage.tsx
src/pages/SelectRolePage.tsx
src/pages/ProfilePage.tsx
src/pages/WishlistPage.tsx
src/pages/clinic/                  (whole folder: Dashboard, Profile, Doctors, Services, Verification)
src/pages/doctor/                  (whole folder: Dashboard, Profile, Verification)
```

### Legacy admin pages (7) — strict Shop+LMS scope
```
src/pages/admin/AdminClinics.tsx
src/pages/admin/AdminDoctors.tsx
src/pages/admin/AdminCMS.tsx
src/pages/admin/AdminCMSEditor.tsx
src/pages/admin/AdminSocial.tsx
src/pages/admin/AdminSupportChat.tsx
src/pages/admin/AdminContactMessages.tsx     (kept only if you want — your answer said strict, so removing)
```
Wait — your "Keep utility pages" answer keeps `/contact` page, so we should keep `AdminContactMessages` too (otherwise contact-form submissions go nowhere). **Final decision: keep AdminContactMessages.** Removing only the 6 above.

### Legacy components (delete entire folders)
```
src/components/social/        (PostCard, StoriesBar, NotificationBell, etc.)
src/components/clinic/        (entire folder)
src/components/doctor/        (entire folder)
src/components/blog/          (ArticleCard)
src/components/booking/       (BookAppointmentWizard)
src/components/explore/       (ExplorePetCard, PetCardSkeleton)
src/components/profile/       (AppointmentCard, MyPetsSection, OrderCard, ProfileHeader)
src/components/academy/EnrollDialog.tsx (uses BookAppointmentWizard? — verify; likely keep, used by /course/:id)
```
Plus standalone:
```
src/components/ClinicCard.tsx
src/components/ClinicSection.tsx
src/components/DoctorCard.tsx
src/components/CategorySection.tsx          (legacy category grid)
src/components/FeaturedProducts.tsx         (replaced by home/FeaturedProductsGrid)
src/components/ProductCard.tsx              (legacy — shop uses src/components/shop/ProductCard)
src/components/ProductReviewForm.tsx
src/components/SupportChatLoader.tsx
src/components/SupportChatWidget.tsx
src/components/GlobalSearch.tsx             (only used by AdminHeader — replace with simple title)
src/components/MobileNav.tsx                (legacy bottom nav with Doctors link; will rebuild lean)
src/components/home/BelowFoldContent.tsx    (uses social posts)
```

### Legacy admin components
```
src/components/admin/cms/                   (whole folder)
src/components/admin/ClinicVerificationDialog.tsx
src/components/admin/VerificationFunnel.tsx
src/components/admin/dashboard/PlatformOverview.tsx       (clinics/doctors stats)
src/components/admin/dashboard/PlatformHealthCard.tsx     (verify — may keep as generic)
```

### Legacy hooks
```
src/hooks/usePosts.ts useStories.ts useFollow.ts useExplorePets.ts useComments.ts
src/hooks/useClinicReviews.ts useClinicOwner.ts
src/hooks/useDoctor.ts useDoctorJoinRequests.ts useDoctorSchedules.ts usePublicDoctors.ts
src/hooks/useAppointments.ts useMessages.ts useNotifications.ts useSupportChat.ts
src/hooks/useCMS.ts useAdminSocialActions.ts
```

### Legacy contexts / types / libs
```
src/contexts/PetContext.tsx
src/contexts/WishlistContext.tsx              (Wishlist page deleted; ProductCard usage trimmed)
src/types/social.ts
src/lib/whatsapp.ts                           (only used by clinic pages — verify)
src/lib/notifications.ts                      (legacy social notifications)
```

### Legacy edge functions (keep all — they're backend, untouched)
No edge function deletions.

## Files to MODIFY

```text
MODIFY  src/App.tsx
        - Remove WishlistProvider wrapper (context deleted)
        - Verify all imports point to surviving pages
        - No route changes (already aligned)

MODIFY  src/components/Navbar.tsx
        - Already clean (Shop, Academy, Dashboard, Admin). Just verify.

MODIFY  src/components/Footer.tsx
        - Already agri-themed. No change.

MODIFY  src/pages/Index.tsx
        - Remove any reference to BelowFoldContent (it's not currently imported — verify clean).

MODIFY  src/pages/ShopPage.tsx
        - Replace `import MobileNav` and remove WishlistContext usage (or keep wishlist as
          a no-op local state if too invasive; safer: drop wishlist UI).

MODIFY  src/pages/CartPage.tsx / CheckoutPage.tsx / ProductDetailPage.tsx
        - Drop MobileNav import + WishlistContext import; keep cart/auth flows intact.

MODIFY  src/components/admin/AdminSidebar.tsx
        - Trim nav to: Dashboard, Analytics | Products, Orders, Customers, Coupons,
          Delivery Zones, Incomplete Orders, Recovery Analytics | Courses, Enrollments
          | Messages, Settings.
        - Remove: Clinics, Doctors, Social, Content Hub, Support Chat, User Management.
        - Rebrand label "VET-MEDIX" → "Z AGRO TECH".

MODIFY  src/components/admin/AdminMobileNav.tsx
        - Mirror the trimmed sidebar nav.

MODIFY  src/components/admin/AdminHeader.tsx
        - Remove GlobalSearch import; replace with the page title slot only.

MODIFY  src/components/admin/dashboard/PlatformOverview.tsx (or delete)
        - If kept: strip clinic/doctor stats.

MODIFY  src/pages/admin/AdminDashboard.tsx
        - Remove imports/usages for deleted CMS/Social/Clinics/Doctors quick links.

MODIFY  src/pages/admin/AdminCustomers.tsx
        - Remove role filters for doctor/clinic_owner if present (keep admin + user only).

ADD     src/pages/admin/AdminEnrollments.tsx     (NEW)
        - Simple table of enrollments with status update (pending/confirmed/completed/cancelled),
          using existing Card + Table + Badge. Wired to enrollments table via supabase client.
        - Linked from sidebar under "LMS".

MODIFY  src/App.tsx
        - Add route /admin/enrollments → AdminEnrollments wrapped in RequireAdmin.
```

## New unified `/admin` structure (visual)

```text
┌─ AdminSidebar ──────────┐  ┌─ AdminHeader (no GlobalSearch) ─┐
│ OVERVIEW                │  │ Page title · refresh · profile  │
│  • Dashboard            │  └─────────────────────────────────┘
│  • Analytics            │  
│ E-COMMERCE              │  ┌─ Page content (DataTable + Cards)┐
│  • Products             │  │ Stats row (4 cards)              │
│  • Orders               │  │ DataTable: search · filter · CRUD│
│  • Customers            │  │ Pagination                       │
│  • Coupons              │  └──────────────────────────────────┘
│  • Delivery Zones       │
│  • Incomplete Orders    │
│  • Recovery Analytics   │
│ LMS                     │
│  • Courses              │
│  • Enrollments  (NEW)   │
│ SYSTEM                  │
│  • Messages             │
│  • Settings             │
└─────────────────────────┘
```

## Guardrails honored

- Supabase client (`src/integrations/supabase/client.ts`) untouched.
- AuthProvider, AuthContext, RequireAuth, RequireAdmin untouched.
- Bento dashboard (`DashboardPage.tsx`, `BentoGrid`, all tiles, agri gradient) untouched.
- No DB migrations.
- Build verification step: after deletions, search for any remaining imports of deleted modules and fix them in the **same** turn.

## Execution protocol

1. Delete the files listed above (folder-batched).
2. Patch every consumer file flagged above.
3. Add `AdminEnrollments.tsx` + route.
4. Trim AdminSidebar/MobileNav/Header.
5. Run search for `from '@/(pages|components|hooks|contexts)/<deleted>'` — fix any remaining import.
6. Verify Vite builds cleanly (TS errors will surface immediately).

## Open questions resolved

- Strict admin scope ✅ · Keep AdminLayout+Sidebar ✅ · Keep utility pages ✅
- Exception: keeping `AdminContactMessages` because `/contact` is kept.

