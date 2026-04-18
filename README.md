![Build Status](https://img.shields.io/badge/Build-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

> **Deployment Status:** Production Ready | Last Updated: 2026-04-18

# Z Agro Tech — Agriculture Supplies & Training Platform

A full-stack agriculture platform for Bangladesh combining an e-commerce shop
for crops, livestock, fertilizer and equipment supplies with an academy of
practical training courses for farmers.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** TanStack React Query, React Context
- **Backend:** Lovable Cloud (authentication, database, storage, edge functions)
- **Routing:** React Router v6

## Project Structure

```
src/
  assets/          — Static images and logos
  components/      — Reusable UI components
    academy/       — Course discovery, enrollment, curriculum
    admin/         — Admin dashboard, products, orders, analytics
    dashboard/     — Customer dashboard tiles and bento grid
    home/          — Landing page sections
    shop/          — Product cards, filters, skeletons
    ui/            — shadcn/ui primitives
  contexts/        — React Context providers (Auth, Cart, Wishlist)
  hooks/           — Custom React hooks (data fetching, business logic)
  integrations/    — Backend client configuration
  lib/             — Utility functions (validation, compression, regions)
  pages/           — Route-level page components
    admin/         — Admin panel pages
  types/           — TypeScript type definitions
supabase/
  functions/       — Edge functions (geocode, PDF parsing, sitemap, courier)
  migrations/      — Database schema migrations
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Backend API URL (auto-configured) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Backend public key (auto-configured) |
| `VITE_SUPABASE_PROJECT_ID` | Backend project ID (auto-configured) |

## Development

```sh
npm install    # Install dependencies
npm run dev    # Start dev server on port 8080
npm run build  # Production build
npm run preview # Preview production build
```

## User Roles

1. **Customer / Farmer** — Browse products, place orders, enroll in courses
2. **Admin** — Sole admin (`nijhumislam570@gmail.com`); manages products,
   orders, courses, customers, analytics, and platform settings.
   Admin role is enforced at the database level by a trigger; no other
   account can hold the `admin` role.
