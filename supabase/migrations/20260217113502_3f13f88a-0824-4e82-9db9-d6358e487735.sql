
-- A. Orders: status filter
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status) WHERE trashed_at IS NULL;

-- B. Orders: payment_status filter
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);

-- C. Appointments: status filter
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);

-- D. Appointments: composite for race condition prevention
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_doctor_date_time 
ON public.appointments (clinic_id, doctor_id, appointment_date, appointment_time);

-- E. Products: category + active filter
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON public.products (category, is_active) WHERE is_active = true;

-- F. Products: featured products query
CREATE INDEX IF NOT EXISTS idx_products_featured 
ON public.products (is_featured) WHERE is_featured = true AND is_active = true;

-- G. Incomplete orders: status filter
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_status 
ON public.incomplete_orders (status) WHERE trashed_at IS NULL;

-- H. Coupons: code lookup
CREATE INDEX IF NOT EXISTS idx_coupons_code_active 
ON public.coupons (code) WHERE is_active = true;

-- I. Follows: follower lookup
CREATE INDEX IF NOT EXISTS idx_follows_follower 
ON public.follows (follower_user_id);

-- J. Follows: following lookup
CREATE INDEX IF NOT EXISTS idx_follows_following 
ON public.follows (following_pet_id);

-- K. Stories: pet + expiry (without now() predicate - filtered at query time instead)
CREATE INDEX IF NOT EXISTS idx_stories_pet_expires 
ON public.stories (pet_id, expires_at DESC);

-- L. Doctor join requests: status filter
CREATE INDEX IF NOT EXISTS idx_doctor_join_requests_status 
ON public.doctor_join_requests (status);

-- M. Wishlists: user lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user 
ON public.wishlists (user_id);

-- N. Wishlists: product lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user_product 
ON public.wishlists (user_id, product_id);
