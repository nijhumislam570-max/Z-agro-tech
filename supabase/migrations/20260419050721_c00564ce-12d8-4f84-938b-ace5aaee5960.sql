-- Performance indexes for Admin Products page
-- Speeds up low-stock filter, SKU lookups, and product_type search

-- Partial index for low-stock queries (admin alerts, badge sync)
CREATE INDEX IF NOT EXISTS idx_products_low_stock
  ON public.products (stock)
  WHERE stock IS NOT NULL AND stock <= 10;

-- SKU lookups for admin search (case-insensitive prefix matching)
CREATE INDEX IF NOT EXISTS idx_products_sku_lower
  ON public.products (lower(sku))
  WHERE sku IS NOT NULL;

-- Product type filter (used in admin search + storefront facets)
CREATE INDEX IF NOT EXISTS idx_products_product_type
  ON public.products (product_type)
  WHERE product_type IS NOT NULL;