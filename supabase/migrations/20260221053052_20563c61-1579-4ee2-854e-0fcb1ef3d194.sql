
-- Add FK constraints for user_id references to auth.users with CASCADE delete
ALTER TABLE public.appointment_waitlist
  ADD CONSTRAINT appointment_waitlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.likes
  ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.follows
  ADD CONSTRAINT follows_follower_user_id_fkey FOREIGN KEY (follower_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.stories
  ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
