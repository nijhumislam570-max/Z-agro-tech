-- Create a limited public view for profiles with only display-safe fields
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id, 
  full_name,
  avatar_url,
  cover_photo_url,
  created_at
FROM public.profiles;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;