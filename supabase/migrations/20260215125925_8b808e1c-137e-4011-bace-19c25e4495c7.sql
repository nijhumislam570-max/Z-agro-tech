
-- Remove the check constraint on products.category that limits to 'Pet'/'Farm'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;
