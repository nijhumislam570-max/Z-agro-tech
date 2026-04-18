-- Fix: Allow admins to create notifications for any user (verification/order status)
-- Keep regular users restricted to self-notifications only
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Create DB trigger for social like notifications (replaces client-side)
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_post_owner_id uuid;
  v_pet_name text;
BEGIN
  SELECT p.user_id INTO v_post_owner_id FROM posts p WHERE p.id = NEW.post_id;
  IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
    SELECT name INTO v_pet_name FROM pets WHERE id = NEW.pet_id;
    INSERT INTO notifications (user_id, type, title, message, actor_pet_id, target_post_id)
    VALUES (
      v_post_owner_id, 'like',
      '❤️ New Like',
      COALESCE(v_pet_name, 'Someone') || ' liked your post',
      NEW.pet_id, NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Create DB trigger for comment notifications
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_post_owner_id uuid;
  v_pet_name text;
BEGIN
  SELECT p.user_id INTO v_post_owner_id FROM posts p WHERE p.id = NEW.post_id;
  IF v_post_owner_id IS NOT NULL AND v_post_owner_id != NEW.user_id THEN
    SELECT name INTO v_pet_name FROM pets WHERE id = NEW.pet_id;
    INSERT INTO notifications (user_id, type, title, message, actor_pet_id, target_post_id)
    VALUES (
      v_post_owner_id, 'comment',
      '💬 New Comment',
      COALESCE(v_pet_name, 'Someone') || ' commented on your post',
      NEW.pet_id, NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Create DB trigger for follow notifications
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_target_owner_id uuid;
  v_follower_pet_name text;
BEGIN
  SELECT user_id INTO v_target_owner_id FROM pets WHERE id = NEW.following_pet_id;
  IF v_target_owner_id IS NOT NULL AND v_target_owner_id != NEW.follower_user_id THEN
    SELECT name INTO v_follower_pet_name FROM pets WHERE id = NEW.follower_pet_id;
    INSERT INTO notifications (user_id, type, title, message, actor_pet_id, target_pet_id)
    VALUES (
      v_target_owner_id, 'follow',
      '🐾 New Follower',
      COALESCE(v_follower_pet_name, 'Someone') || ' started following your pet',
      NEW.follower_pet_id, NEW.following_pet_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();