
User wants a PDF sitemap for stakeholder handoff. This is a one-off artifact generation task — use exec mode with reportlab. Content is already mapped from previous response.

**Plan:**

Generate `Z-Agro-Tech-Sitemap.pdf` in `/mnt/documents/` using Python + reportlab.

**Document structure (~6-8 pages, US Letter):**
1. Cover page — title, brand tagline, generated date, project URL
2. Executive summary — counts (30 routes, 6 edge functions, 4 categories)
3. Public routes table (15 rows)
4. Auth-gated routes table (3 rows) + redirects (1 row)
5. Admin routes table (14 rows)
6. Forms inventory (grouped: Public / Commerce / Admin)
7. Features inventory (grouped: Storefront / Academy / Auth / Admin / Platform)
8. Edge functions + key DB tables

**Styling:**
- Warm beige background accents matching brand
- Coral/peach (#E8775A-ish) section headers
- Fredoka-substitute (Helvetica-Bold) for headings, Helvetica for body
- Tables with light borders, alternating row shading
- Page numbers in footer

**QA:** Convert to images via pdftoppm, inspect every page for clipping/overflow, fix and re-render.

**Deliverable:** `<lov-artifact>` tag pointing to the PDF.
