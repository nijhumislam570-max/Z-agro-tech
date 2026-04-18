

# Phase 2 — Cohort-based Training Courses (e-krishi style)

The reference site sells **instructor-led training cohorts**, not on-demand video. Courses are scheduled batches (15 / 30 / 60-90 days), enrollment goes through WhatsApp, and graduates receive certificates. Phase 2 reshapes the Academy around this model.

## What we're building

1. **Course model upgrade** — duration, mode (online/onsite/hybrid), curriculum (bullet list of topics in Bangla), audience tagline, certificate flag.
2. **Course batches** — each course can have multiple scheduled batches with start date, seat count, and "Open / Filling Fast / Closed" status badges.
3. **WhatsApp enrollment** — primary CTA opens WhatsApp with a prefilled message (matches reference site UX). Optional in-app "Request to Enroll" creates an enrollment row in `pending` status for admin follow-up. **No payment gateway in this phase.**
4. **Curriculum-rich Course Detail page** — hero, audience pill, duration/mode badges, curriculum checklist, batch picker, instructor card, certificate note, success stats.
5. **Academy listing redesign** — filter chips by category (Plant Doctor, Plant Protection, Smart Farming, Urban Farming), each card shows duration + mode + next batch.
6. **Trust strip on Home** — stats row (trained farmers, courses delivered, satisfaction %, years of experience).
7. **Admin: Courses + Batches** — extend `AdminCourses` with curriculum editor (tag input) and a Batches sub-table per course.
8. **Dashboard "My Courses" tab** — shows enrollment status (`pending` / `confirmed` / `completed`) and batch dates.

Out of scope: payments, video player, progress tracking, certificates issuance — all deferred.

## Database changes (additive migration)

```text
ALTER TABLE courses ADD:
  category text                 -- 'plant_doctor' | 'plant_protection' | 'smart_farming' | 'urban_farming' | 'organic' | 'other'
  duration_label text           -- e.g. '১৫ দিন', '৩০ দিন', '২/৩ মাস'
  mode text                     -- 'online' | 'onsite' | 'hybrid'
  audience text                 -- short tagline
  curriculum jsonb              -- string[] of topic bullets
  whatsapp_number text          -- override per course (falls back to global)
  whatsapp_message text         -- prefilled enrollment message
  provides_certificate boolean default true
  language text default 'bn'

NEW TABLE course_batches
  id, course_id (fk), name, start_date, end_date,
  total_seats int, enrolled_count int default 0,
  status text ('open'|'filling'|'closed'|'completed'),
  created_at
  RLS: public SELECT, admin write

ALTER TABLE enrollments ADD:
  batch_id uuid → course_batches (nullable)
  status text default 'pending'   -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
  contact_phone text
  notes text
```

RLS for batches mirrors `courses`. Existing enrollment policies stay (user owns rows).

## File-change summary

```text
DB MIGRATION  add columns to courses + enrollments, create course_batches

ADD     src/lib/whatsapp.ts                       (build wa.me URL)
ADD     src/components/academy/CourseCategoryChips.tsx
ADD     src/components/academy/CurriculumList.tsx
ADD     src/components/academy/BatchPicker.tsx
ADD     src/components/academy/EnrollDialog.tsx   (WhatsApp + in-app request)
ADD     src/components/home/TrustStatsStrip.tsx
ADD     src/components/admin/CurriculumEditor.tsx
ADD     src/components/admin/CourseBatchesTable.tsx
ADD     src/hooks/useCourseBatches.ts

MODIFY  src/hooks/useCourses.ts          (new fields + category filter)
MODIFY  src/hooks/useEnrollments.ts      (batch_id, status, contact_phone)
MODIFY  src/components/academy/CourseCard.tsx   (duration/mode badges, next batch)
MODIFY  src/pages/AcademyPage.tsx        (category chips, filtered grid)
MODIFY  src/pages/CourseDetailPage.tsx   (curriculum, batches, enroll dialog)
MODIFY  src/pages/admin/AdminCourses.tsx (curriculum + batches UI)
MODIFY  src/components/dashboard/CoursesTab.tsx (status badges, batch dates)
MODIFY  src/pages/Index.tsx              (mount TrustStatsStrip)
MODIFY  src/integrations/supabase/types.ts (auto-regen after migration)
```

## UX details

- **Category chips:** Plant Doctor · Plant Protection · Smart Farming · Urban Farming · Organic · All
- **Course card badges:** duration (e.g., "30 days"), mode pill, and a small "Next batch: 15 May" line if a batch exists.
- **Batch picker:** radio-card list inside Course Detail — selecting one enables the enroll button. Closed batches greyed out.
- **Enroll dialog:** two CTAs — primary "Continue on WhatsApp" (opens prefilled wa.me link with course + batch name), secondary "Request callback" (logs an enrollment row, requires phone number, admin sees it in `/admin/incomplete-orders`-style queue — reusing existing patterns).
- **Bilingual ready:** schema supports Bangla content; UI labels stay English for now (i18n is a future phase).

## Open question

Just one — please confirm the WhatsApp number to use as the global default (the reference site uses `+8801763585500`). I'll store it as a setting and let admin override per course.

