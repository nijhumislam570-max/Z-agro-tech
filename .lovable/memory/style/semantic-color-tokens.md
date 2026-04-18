---
name: Semantic Color Token System
description: Mandatory token families (success/warning/info/danger/accent/neutral) and canonical badge/gradient patterns — never use raw Tailwind palette colors
type: design
---

# Semantic Color Token System (Z Agro Tech)

The codebase uses semantic tokens defined in `src/index.css` and exposed via `tailwind.config.ts`. **Never write `bg-green-500`, `text-amber-700`, etc.** — always reach for the semantic family that matches the meaning.

## Token families

| Family | Meaning | Tokens (light/dark auto-themed) |
|---|---|---|
| `success` | positive outcome (delivered, paid, low-risk, online) | `bg-success`, `bg-success-light`, `bg-success-soft`, `text-success`, `text-success-foreground`, `border-success-border` |
| `warning` | caution (pending, low stock, medium risk, refunded) | `bg-warning`, `bg-warning-light`, `bg-warning-soft`, `text-warning`, `text-warning-foreground`, `border-warning-border` |
| `info` | neutral informational (processing, shipped, in-transit) | `bg-info`, `bg-info-light`, `bg-info-soft`, `text-info`, `text-info-foreground`, `border-info-border` |
| `danger` | negative (cancelled, rejected, high risk, offline) | `bg-danger`, `bg-danger-light`, `bg-danger-soft`, `text-danger`, `text-danger-foreground`, `border-danger-border` |
| `accent` | brand harvest / premium / admin badge variety | `bg-accent`, `text-accent`, `bg-accent/10`, `border-accent/30` |
| `primary` | brand forest green / primary CTA | `bg-primary`, `text-primary`, `bg-primary/10` |
| `neutral` | non-semantic surface variation | `bg-neutral-soft`, `border-neutral-border` (or use `bg-muted` / `text-muted-foreground`) |
| `destructive` | shadcn-builtin alias for danger (button variant only) | `bg-destructive`, `text-destructive-foreground` |

## Canonical patterns

### Status badges (light bg + readable text)
```tsx
'bg-success-light text-success'         // delivered, paid
'bg-info-light    text-info'            // processing, shipped
'bg-warning-light text-warning-foreground'  // pending, refunded (warning fg is dark amber, not white)
'bg-danger-light  text-danger'          // cancelled, rejected
'bg-muted         text-muted-foreground'    // neutral / unknown
```

### Solid badges / chips (mid bg + light text)
```tsx
'bg-success text-success-foreground'    // green pill
'bg-warning text-warning-foreground'    // amber pill — fg auto-flips for contrast
'bg-info    text-info-foreground'
'bg-danger  text-danger-foreground'
```

### Stat-card gradient backgrounds
```tsx
'bg-gradient-to-br from-success-soft to-success-soft/50 border-success-border'
'bg-gradient-to-br from-warning-soft to-warning-soft/50 border-warning-border'
'bg-gradient-to-br from-info-soft    to-info-soft/50    border-info-border'
'bg-gradient-to-br from-accent/10    to-accent/5        border-accent/30'  // for "admin / premium" tiles
```

## Rule for new code
1. Pick the meaning, then the family. If green=success and amber=warning aren't right, use `accent` (decorative variety) — **never** reach for `bg-purple-100` or `text-blue-600`.
2. Light-on-light pairs MUST use `text-{family}` (the dark color), not `text-{family}-foreground` (which is white).
3. Solid pills MUST use `text-{family}-foreground` (auto-contrasted).
4. Star ratings: `text-warning fill-warning` (golden amber).

## Sprint 6 outcome
- Migrated 700+ hardcoded color classes across 35 files in a single sweep.
- Net result: 0 raw `bg-{palette}-{shade}` / `text-{palette}-{shade}` / `border-…` / `ring-…` / `from-…` / `to-…` / `via-…` references in `src/`.
- New tokens added to `index.css`: `info`, `info-light`, `info-soft`, `info-border`, `info-foreground`, `danger`, `danger-light`, `danger-soft`, `danger-border`, `danger-foreground`, `success-soft`, `success-border`, `warning-soft`, `warning-border`, `neutral-soft`, `neutral-border`. All have light-mode + dark-mode pairs.
