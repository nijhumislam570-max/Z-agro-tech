
-- Clean orphaned rows where user_id references deleted auth users
DELETE FROM public.likes WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.comments WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.follows WHERE follower_user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.stories WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.appointment_waitlist WHERE user_id NOT IN (SELECT id FROM auth.users);
