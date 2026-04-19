-- Speeds up the admin E-Commerce Customers page filters & bulk updates
-- Partial index — only non-null, non-default payment_status rows
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_active
  ON public.orders (payment_status, user_id)
  WHERE payment_status IS NOT NULL;

-- Speeds up role lookups by (user_id, role) — used for admin checks and updates
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles (user_id, role);