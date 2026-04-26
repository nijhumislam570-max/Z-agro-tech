![Build Status](https://img.shields.io/badge/Build-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

> **Deployment Status:** Production Ready | Last Updated: 2026-04-18

# Z Agro Tech - Agriculture Supplies & Training Platform

A full-stack agriculture platform for Bangladesh combining an e-commerce shop
for crops, livestock, fertilizer and equipment supplies with an academy of
practical training courses for farmers.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** TanStack React Query, React Context
- **Backend:** Supabase (authentication, database, storage, edge functions)
- **Routing:** React Router v7

## Project Structure

```text
src/
  assets/          - Static images and logos
  components/      - Reusable UI components
    academy/       - Course discovery, enrollment, curriculum
    admin/         - Admin dashboard, products, orders, analytics
    dashboard/     - Customer dashboard tiles and bento grid
    home/          - Landing page sections
    shop/          - Product cards, filters, skeletons
    ui/            - shadcn/ui primitives
  contexts/        - React Context providers (Auth, Cart, Wishlist)
  hooks/           - Custom React hooks (data fetching, business logic)
  integrations/    - Backend client configuration
  lib/             - Utility functions (validation, compression, regions)
  pages/           - Route-level page components
    admin/         - Admin panel pages
  types/           - TypeScript type definitions
supabase/
  functions/       - Edge functions (geocode, PDF parsing, sitemap, courier)
  migrations/      - Database schema migrations
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SITE_URL` | Public site URL used for canonical links and SEO |

## Development

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Project Ownership

- GitHub remote: [nijhumislam570-max/Z-agro-tech](https://github.com/nijhumislam570-max/Z-agro-tech)
- Supabase project ref: `hsosfeynosulypnpwbet`
- Vercel deployment config: [vercel.json](/D:/Z%20agro%20tech%20code/z-agro/vercel.json)
- Example frontend env file: [.env.example](/D:/Z%20agro%20tech%20code/z-agro/.env.example)

## Backend Ownership

- `supabase/functions/` contains the live edge-function source owned by this repo.
- `supabase/migrations/` contains the schema history tracked in git.
- `supabase/migration-bundle/` contains the full baseline migration bundle:
  schema, data, storage setup, and admin bootstrap SQL for rebuilding the
  project on your Supabase account.
- Set the Supabase edge-function secret `PUBLIC_SITE_URL` to your final domain
  so the sitemap function emits your project-owned URLs.

## Migration Runbook

1. Link the repo to Supabase:
   `pwsh ./scripts/complete-supabase-link.ps1`
2. Apply schema history:
   `npx supabase db push --linked`
3. Regenerate database types:
   `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`
4. Apply bundle data and storage SQL:
   Use the files in [supabase/migration-bundle](/D:/Z%20agro%20tech%20code/z-agro/supabase/migration-bundle/README.md)
5. Prepare and apply the admin bootstrap SQL:
   `pwsh ./scripts/prepare-admin-bootstrap.ps1 -AdminUserId "<auth-user-uuid>"`
6. Validate the live project:
   `npm run validate:supabase`

## User Roles

1. **Customer / Farmer** - Browse products, place orders, enroll in courses
2. **Admin** - Sole admin (`nijhumislam570@gmail.com`); manages products,
   orders, courses, customers, analytics, and platform settings.
   Admin role is enforced at the database level by a trigger; no other
   account can hold the `admin` role.
