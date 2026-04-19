CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_unread ON public.contact_messages (status) WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);