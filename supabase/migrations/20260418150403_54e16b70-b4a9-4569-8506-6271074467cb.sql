-- H5: Tighten incomplete_orders — user_id NOT NULL (clean any orphan rows first)
DELETE FROM public.incomplete_orders WHERE user_id IS NULL;
ALTER TABLE public.incomplete_orders ALTER COLUMN user_id SET NOT NULL;

-- M1: Server-side spam guard on contact messages — minimum length 10 chars
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_message_min_length
  CHECK (char_length(message) >= 10);

-- M2: Enforce one review per (user, product)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_unique
  ON public.reviews (user_id, product_id);