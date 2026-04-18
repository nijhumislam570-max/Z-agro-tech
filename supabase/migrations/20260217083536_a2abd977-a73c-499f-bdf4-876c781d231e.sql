
-- P0: Admin DELETE RLS policies for social moderation
CREATE POLICY "Admins can delete posts" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete comments" ON public.comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete likes" ON public.likes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pets" ON public.pets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete stories" ON public.stories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete follows" ON public.follows FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- P0: Seed CMS categories
INSERT INTO public.cms_categories (name, slug, description, is_active) VALUES
  ('Health Tips', 'health-tips', 'Pet health and wellness advice', true),
  ('Vet Care', 'vet-care', 'Veterinary care guides and information', true),
  ('Announcements', 'announcements', 'Platform news and updates', true),
  ('News', 'news', 'Industry and community news', true),
  ('Pet Guides', 'pet-guides', 'Guides for pet owners', true)
ON CONFLICT DO NOTHING;
