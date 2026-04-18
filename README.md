![Build Status](https://img.shields.io/badge/Build-Production%20Ready-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

> **Deployment Status:** Production Ready | Last Updated: 2026-02-17

# VET-MEDIX — Pet Care & Veterinary Platform

A full-stack pet care platform for Bangladesh featuring veterinary clinic discovery,
appointment booking, e-commerce, and a social network for pet owners.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, shadcn/ui
- **State Management:** TanStack React Query, React Context
- **Backend:** Lovable Cloud (authentication, database, storage, edge functions)
- **Routing:** React Router v7

## Project Structure

```
src/
  assets/          — Static images and logos
  components/      — Reusable UI components
    admin/         — Admin dashboard components
    clinic/        — Clinic owner dashboard components
    doctor/        — Doctor dashboard components
    social/        — Social feed components (posts, stories, comments)
    ui/            — shadcn/ui primitives
  contexts/        — React Context providers (Auth, Cart, Wishlist, Pet)
  hooks/           — Custom React hooks (data fetching, business logic)
  integrations/    — Backend client configuration
  lib/             — Utility functions (validation, compression, notifications)
  pages/           — Route-level page components
    admin/         — Admin panel pages
    clinic/        — Clinic owner pages
    doctor/        — Doctor pages
  types/           — TypeScript type definitions
supabase/
  functions/       — Backend functions (geocode, PDF parsing, sitemap, courier)
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

1. **Pet Parent** — Browse clinics, book appointments, shop products, social feed
2. **Doctor** — Manage profile, schedules, join clinics
3. **Clinic Owner** — Manage clinic, doctors, services, appointments
4. **Admin** — Full platform management, analytics, CMS
