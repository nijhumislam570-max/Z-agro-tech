-- ================================================================
-- 20260110073130_bc88f40d-790f-422e-8358-dd4c9bec56e2.sql
-- ================================================================
-- Create profiles table for user addresses
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  division TEXT,
  district TEXT,
  thana TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Pet', 'Farm')),
  product_type TEXT,
  image_url TEXT,
  images TEXT[],
  badge TEXT,
  discount INTEGER,
  stock INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS and allow public read
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON public.products
  FOR SELECT USING (true);

-- Clinics table
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  distance TEXT,
  services TEXT[],
  image_url TEXT,
  is_open BOOLEAN DEFAULT true,
  opening_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS and allow public read
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinics are viewable by everyone" ON public.clinics
  FOR SELECT USING (true);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  pet_name TEXT,
  pet_type TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  shipping_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Product reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products
INSERT INTO public.products (name, description, price, category, product_type, image_url, badge, discount) VALUES
('ACI Godrej Cattle Feed (50kg)', 'Premium quality cattle feed for healthy livestock growth. Rich in proteins and essential nutrients.', 2400, 'Farm', 'Feed', 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=400&fit=crop', NULL, 10),
('Whiskas Ocean Fish (1.2kg)', 'Delicious ocean fish flavored cat food packed with essential nutrients for your feline friend.', 850, 'Pet', 'Food', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop', NULL, NULL),
('Renamycin-100 Antibiotic', 'Broad-spectrum antibiotic for livestock. Prescription required.', 120, 'Farm', 'Medicine', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Rx Required', NULL),
('Royal Canin Adult Dog Food', 'Premium dog food with balanced nutrition for adult dogs of all breeds.', 4500, 'Pet', 'Food', 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&h=400&fit=crop', NULL, 15),
('Premium Poultry Feed (25kg)', 'High-protein feed for healthy poultry growth and egg production.', 1200, 'Farm', 'Feed', 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=400&fit=crop', NULL, NULL),
('Cat Scratching Post Tower', 'Multi-level scratching post with comfortable platforms for cats.', 2800, 'Pet', 'Accessories', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=400&fit=crop', NULL, NULL),
('Calcium Supplement for Cattle', 'Essential calcium supplement for bone health and milk production.', 350, 'Farm', 'Supplement', 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=400&fit=crop', NULL, NULL),
('Dog Collar with LED Light', 'Safety LED collar for night walks. Rechargeable and waterproof.', 650, 'Pet', 'Accessories', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop', NULL, 20);

-- Insert sample clinics
INSERT INTO public.clinics (name, address, phone, rating, distance, services, image_url, is_open) VALUES
('Vet Care Lalmatia', 'House 12, Road 27, Dhanmondi, Dhaka', '+880 1712-345678', 4.8, '1.2 km', ARRAY['Surgery', 'Vaccine', '24/7'], 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=400&fit=crop', true),
('Savar Dairy Vet Point', 'Savar Dairy Road, Savar, Dhaka', '+880 1812-456789', 4.5, '12 km', ARRAY['Large Animal', 'Farm Visits'], 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=400&fit=crop', true),
('PetCare Plus Gulshan', 'Road 11, Gulshan 2, Dhaka', '+880 1912-567890', 4.9, '3.5 km', ARRAY['Grooming', 'Dental', 'Vaccination'], 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=400&fit=crop', false);
-- ================================================================
-- 20260111050103_8d9ac34a-724e-48df-8c75-e4eb41458207.sql
-- ================================================================
-- Add DELETE policy for appointments table so users can delete their own appointments
CREATE POLICY "Users can delete their own appointments" 
ON public.appointments 
FOR DELETE 
USING (auth.uid() = user_id);
-- ================================================================
-- 20260111054332_42009801-a2a2-4bba-8834-7d2319b4e09c.sql
-- ================================================================
-- Create pets table for user's pet profiles
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL, -- dog, cat, bird, fish, etc.
  breed TEXT,
  age TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  media_type TEXT DEFAULT 'image', -- 'image' or 'video'
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follows table
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_user_id UUID NOT NULL,
  follower_pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  following_pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_user_id, following_pet_id)
);

-- Enable RLS on all tables
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Pets policies
CREATE POLICY "Pets are viewable by everyone" ON public.pets FOR SELECT USING (true);
CREATE POLICY "Users can create their own pets" ON public.pets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts for their pets" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow pets" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_user_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update like counts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update comment counts
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for counts
CREATE TRIGGER on_like_change AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
CREATE TRIGGER on_comment_change AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Create storage bucket for pet media
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-media', 'pet-media', true);

-- Storage policies for pet media
CREATE POLICY "Anyone can view pet media" ON storage.objects FOR SELECT USING (bucket_id = 'pet-media');
CREATE POLICY "Authenticated users can upload pet media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'pet-media' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own pet media" ON storage.objects FOR UPDATE USING (bucket_id = 'pet-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own pet media" ON storage.objects FOR DELETE USING (bucket_id = 'pet-media' AND auth.uid()::text = (storage.foldername(name))[1]);
-- ================================================================
-- 20260111055736_6ae4ef68-13cc-4d42-ad1c-e8187c7f7e44.sql
-- ================================================================
-- Create stories table (48-hour expiry)
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  caption TEXT,
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create story views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_user_id)
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Everyone can view active stories" ON public.stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Users can create stories for their pets" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Story owners can view who watched" ON public.story_views FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid()) OR auth.uid() = viewer_user_id);
CREATE POLICY "Users can mark stories as viewed" ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_user_id);

-- Function to update story views count
CREATE OR REPLACE FUNCTION public.increment_story_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories SET views_count = views_count + 1 WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_story_view AFTER INSERT ON public.story_views FOR EACH ROW EXECUTE FUNCTION public.increment_story_views();

-- Add location to pets for discovery
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS location TEXT;

-- Create indexes
CREATE INDEX idx_pets_species ON public.pets(species);
CREATE INDEX idx_stories_expires ON public.stories(expires_at);
-- ================================================================
-- 20260111055908_29ef3584-a13c-41be-9874-3446770743a9.sql
-- ================================================================
-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1_id UUID NOT NULL,
  participant_2_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);
CREATE POLICY "Participants can update conversations" ON public.conversations FOR UPDATE USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Messages policies
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = messages.conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ));
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ));
CREATE POLICY "Participants can update message read status" ON public.messages FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = messages.conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  ));

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();
-- ================================================================
-- 20260111055922_f301b251-2bd0-4a0a-9040-3d682537b2b6.sql
-- ================================================================
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  actor_pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  target_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  target_pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- ================================================================
-- 20260111055931_476c0c3a-9a7d-492f-b6e8-b7f04eb8bc26.sql
-- ================================================================
-- Drop the overly permissive INSERT policy for notifications
DROP POLICY IF EXISTS "Anyone can create notifications" ON public.notifications;

-- Create a more restrictive policy - authenticated users can create notifications
CREATE POLICY "Authenticated users can create notifications" ON public.notifications 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- ================================================================
-- 20260112051034_30d9ba0f-457c-4a18-b0f4-0f3765561ac6.sql
-- ================================================================
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
-- ================================================================
-- 20260112052950_f77819cc-7480-4bef-a7f3-c7065375c3d4.sql
-- ================================================================
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload product images
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow public read access to product images
CREATE POLICY "Product images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Add RLS policies for admin product management
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for admin order management
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
-- ================================================================
-- 20260112054400_55ae1da8-1b9a-41d8-ae8d-f1e5eee07fdd.sql
-- ================================================================
-- Drop the overly permissive notification INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a more restrictive notification INSERT policy
-- Only allow users to create notifications if they are the owner of the actor_pet
-- OR if they are creating a notification for themselves (system notifications)
CREATE POLICY "Users can create valid notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (
    -- System notifications (user creating for themselves)
    auth.uid() = user_id
    -- OR the actor_pet belongs to the authenticated user
    OR (
      actor_pet_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM public.pets 
        WHERE id = actor_pet_id 
        AND user_id = auth.uid()
      )
    )
  )
);
-- ================================================================
-- 20260113050926_f81a79f2-70cf-4cac-962c-bedc6ca4236a.sql
-- ================================================================
-- Add new roles to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'doctor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'clinic_owner';

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT,
  qualifications TEXT[],
  experience_years INTEGER,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  license_number TEXT,
  consultation_fee NUMERIC,
  is_available BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to clinics table for owner management
ALTER TABLE public.clinics 
  ADD COLUMN IF NOT EXISTS owner_user_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Create clinic_doctors junction table
CREATE TABLE public.clinic_doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, doctor_id)
);

-- Create clinic_services table for managing services
CREATE TABLE public.clinic_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is clinic owner
CREATE OR REPLACE FUNCTION public.is_clinic_owner(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinics
    WHERE id = _clinic_id
      AND owner_user_id = _user_id
  )
$$;

-- Create helper function to get user's doctor id
CREATE OR REPLACE FUNCTION public.get_doctor_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE user_id = _user_id LIMIT 1
$$;

-- Doctors table policies
CREATE POLICY "Doctors are viewable by everyone" 
ON public.doctors FOR SELECT USING (true);

CREATE POLICY "Users can create their own doctor profile" 
ON public.doctors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own profile" 
ON public.doctors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can delete their own profile" 
ON public.doctors FOR DELETE 
USING (auth.uid() = user_id);

-- Clinic_doctors policies
CREATE POLICY "Clinic doctors are viewable by everyone" 
ON public.clinic_doctors FOR SELECT USING (true);

CREATE POLICY "Clinic owners can add doctors" 
ON public.clinic_doctors FOR INSERT 
WITH CHECK (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can update doctor status" 
ON public.clinic_doctors FOR UPDATE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can remove doctors" 
ON public.clinic_doctors FOR DELETE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

-- Clinic_services policies
CREATE POLICY "Clinic services are viewable by everyone" 
ON public.clinic_services FOR SELECT USING (true);

CREATE POLICY "Clinic owners can add services" 
ON public.clinic_services FOR INSERT 
WITH CHECK (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can update services" 
ON public.clinic_services FOR UPDATE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can delete services" 
ON public.clinic_services FOR DELETE 
USING (public.is_clinic_owner(auth.uid(), clinic_id));

-- Update clinics table policies for owner management
CREATE POLICY "Clinic owners can update their clinic" 
ON public.clinics FOR UPDATE 
USING (owner_user_id = auth.uid());

CREATE POLICY "Clinic owners can insert clinics" 
ON public.clinics FOR INSERT 
WITH CHECK (owner_user_id = auth.uid());

-- Update appointments table to include doctor_id
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL;

-- Create trigger to update doctors updated_at
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- ================================================================
-- 20260113053148_6daa4f36-07df-407d-b699-56d57ce8ad2e.sql
-- ================================================================
-- Add RLS policies for clinic owners to view and manage appointments at their clinics

-- Policy for clinic owners to view all appointments at their clinic
CREATE POLICY "Clinic owners can view clinic appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = appointments.clinic_id
    AND clinics.owner_user_id = auth.uid()
  )
);

-- Policy for clinic owners to update appointments at their clinic (e.g., confirm/cancel)
CREATE POLICY "Clinic owners can update clinic appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = appointments.clinic_id
    AND clinics.owner_user_id = auth.uid()
  )
);

-- Policy for doctors to view appointments assigned to them
CREATE POLICY "Doctors can view their assigned appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
);

-- Policy for doctors to update their assigned appointments
CREATE POLICY "Doctors can update their assigned appointments"
ON public.appointments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = appointments.doctor_id
    AND doctors.user_id = auth.uid()
  )
);
-- ================================================================
-- 20260114042133_74728df7-0a5c-4c0e-9e79-3b328637f9a9.sql
-- ================================================================
-- Make user_id nullable so clinic owners can create doctor profiles
-- without requiring the doctor to have a user account
ALTER TABLE public.doctors 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add a column to track if doctor was created by clinic vs self-registered
ALTER TABLE public.doctors 
  ADD COLUMN IF NOT EXISTS created_by_clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Update RLS policy for doctors to allow clinic owners to create doctors for their clinic
CREATE POLICY "Clinic owners can create doctors for their clinic" 
ON public.doctors 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) OR 
  (created_by_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = created_by_clinic_id 
    AND clinics.owner_user_id = auth.uid()
  ))
);

-- Update policy for clinic owners to update doctors they created
CREATE POLICY "Clinic owners can update doctors they created" 
ON public.doctors 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (created_by_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = created_by_clinic_id 
    AND clinics.owner_user_id = auth.uid()
  ))
);

-- Update policy for clinic owners to delete doctors they created
CREATE POLICY "Clinic owners can delete doctors they created" 
ON public.doctors 
FOR DELETE 
USING (
  (auth.uid() = user_id) OR 
  (created_by_clinic_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.clinics 
    WHERE clinics.id = created_by_clinic_id 
    AND clinics.owner_user_id = auth.uid()
  ))
);
-- ================================================================
-- 20260114194008_c00680b4-061e-4d74-852a-e04ef1622c52.sql
-- ================================================================
-- Allow new users to insert their own role (one-time self-assignment)
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);
-- ================================================================
-- 20260114203022_0807ef90-a5ef-43e0-818d-12076e49828d.sql
-- ================================================================
-- Add avatar_url to profiles table if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ================================================================
-- 20260114210157_3c22bbbb-8f3d-4b3c-b193-9603d06c2335.sql
-- ================================================================
-- Add new columns to notifications table for order and appointment tracking
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_order_id UUID,
ADD COLUMN IF NOT EXISTS target_appointment_id UUID;

-- Add payment_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';

-- Add index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_target_order ON public.notifications(target_order_id) WHERE target_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_target_appointment ON public.notifications(target_appointment_id) WHERE target_appointment_id IS NOT NULL;
-- ================================================================
-- 20260115194813_c69a6163-91c5-467c-8aa2-2d298cd40e53.sql
-- ================================================================
-- Create doctor_schedules table for managing doctor availability
CREATE TABLE public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  clinic_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT true,
  max_appointments INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(doctor_id, clinic_id, day_of_week, start_time)
);

-- Add reminder tracking columns to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_type TEXT;

-- Enable RLS on doctor_schedules
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_schedules

-- Everyone can view active schedules (for booking purposes)
CREATE POLICY "Doctor schedules are viewable by everyone"
ON public.doctor_schedules
FOR SELECT
USING (true);

-- Clinic owners can insert schedules for their clinic
CREATE POLICY "Clinic owners can insert schedules"
ON public.doctor_schedules
FOR INSERT
WITH CHECK (is_clinic_owner(auth.uid(), clinic_id));

-- Clinic owners can update schedules for their clinic
CREATE POLICY "Clinic owners can update schedules"
ON public.doctor_schedules
FOR UPDATE
USING (is_clinic_owner(auth.uid(), clinic_id));

-- Clinic owners can delete schedules for their clinic
CREATE POLICY "Clinic owners can delete schedules"
ON public.doctor_schedules
FOR DELETE
USING (is_clinic_owner(auth.uid(), clinic_id));

-- Doctors can view their own schedules
CREATE POLICY "Doctors can view own schedules"
ON public.doctor_schedules
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.doctors 
  WHERE doctors.id = doctor_schedules.doctor_id 
  AND doctors.user_id = auth.uid()
));

-- Create trigger for updating updated_at
CREATE TRIGGER update_doctor_schedules_updated_at
BEFORE UPDATE ON public.doctor_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- ================================================================
-- 20260115201440_112d903c-0b1e-4d70-8a35-37415b299b7b.sql
-- ================================================================
-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create clinic-images bucket for clinic photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-images', 'clinic-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for avatars bucket
-- Public can read all avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar (folder must match their user id)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for clinic-images bucket
-- Public can read all clinic images
CREATE POLICY "Clinic images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-images');

-- Clinic owners can upload images for their clinic
CREATE POLICY "Clinic owners can upload clinic images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-images' 
  AND public.is_clinic_owner(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Clinic owners can update their clinic images
CREATE POLICY "Clinic owners can update clinic images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'clinic-images' 
  AND public.is_clinic_owner(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- Clinic owners can delete their clinic images
CREATE POLICY "Clinic owners can delete clinic images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinic-images' 
  AND public.is_clinic_owner(auth.uid(), (storage.foldername(name))[1]::uuid)
);
-- ================================================================
-- 20260117055941_d67ce855-5f4a-40fc-82fc-2adc258d6a96.sql
-- ================================================================
-- Add columns for Steadfast tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_id TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS consignment_id TEXT;

-- Add index for faster tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_id ON public.orders(tracking_id);
CREATE INDEX IF NOT EXISTS idx_orders_consignment_id ON public.orders(consignment_id);
-- ================================================================
-- 20260117061304_6d0f26f1-df00-4bd6-9cb3-0e6ad8fdfc46.sql
-- ================================================================
-- Create a public view for doctors that excludes sensitive contact information
-- This allows public discoverability while protecting personal data

CREATE VIEW public.doctors_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  specialization,
  qualifications,
  experience_years,
  bio,
  avatar_url,
  consultation_fee,
  is_available,
  is_verified,
  created_by_clinic_id,
  created_at,
  updated_at
FROM public.doctors;
-- Note: email, phone, license_number, and user_id are excluded from public view

-- Drop the existing public policy that allows everyone to view all doctor data
DROP POLICY IF EXISTS "Doctors are viewable by everyone" ON public.doctors;

-- Create new restricted policies for the base doctors table:

-- 1. Authenticated users can view basic doctor info (needed for appointment booking)
CREATE POLICY "Authenticated users can view doctors"
ON public.doctors FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Doctors can view their own full profile (already covered by existing policies)
-- The existing update/delete policies already handle ownership via user_id

-- Grant SELECT on the public view to anon and authenticated roles
GRANT SELECT ON public.doctors_public TO anon;
GRANT SELECT ON public.doctors_public TO authenticated;
-- ================================================================
-- 20260117064959_f6931e59-f268-4255-a7d9-3d77135aed15.sql
-- ================================================================
-- Create a function to check pet count limit
CREATE OR REPLACE FUNCTION public.check_pet_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.pets WHERE user_id = NEW.user_id) >= 30 THEN
    RAISE EXCEPTION 'Maximum limit of 30 pets reached';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce the limit
CREATE TRIGGER enforce_pet_limit
  BEFORE INSERT ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pet_limit();
-- ================================================================
-- 20260117073129_adc662cc-c928-4b8f-b6dd-ccd0907035ea.sql
-- ================================================================
-- Add verification fields to clinics table
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted' CHECK (verification_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS bvc_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS trade_license_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_nid TEXT;

-- Update existing verified clinics to 'approved' status
UPDATE public.clinics 
SET verification_status = 'approved' 
WHERE is_verified = true AND verification_status IS NULL;

-- Update existing unverified clinics to 'not_submitted' status  
UPDATE public.clinics 
SET verification_status = 'not_submitted' 
WHERE is_verified = false AND verification_status IS NULL;

-- Create storage bucket for clinic verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-documents', 'clinic-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for clinic documents bucket (private - only owner and admin can access)
CREATE POLICY "Clinic owners can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clinic owners can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all clinic documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'clinic-documents' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clinic owners can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Clinic owners can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'clinic-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- ================================================================
-- 20260117074124_3162d7db-d389-4f77-9172-6574d943d126.sql
-- ================================================================
-- Add is_blocked column to clinics table
ALTER TABLE public.clinics
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Allow admins to delete clinics
CREATE POLICY "Admins can delete clinics"
ON public.clinics
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update appointments to prevent booking at blocked clinics (via application logic)
-- ================================================================
-- 20260117134129_b44b64c5-c97f-4431-9341-7e93ce29f162.sql
-- ================================================================
-- Create clinic_reviews table
CREATE TABLE public.clinic_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, user_id)
);

-- Enable RLS
ALTER TABLE public.clinic_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view clinic reviews"
ON public.clinic_reviews
FOR SELECT
USING (true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.clinic_reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.clinic_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.clinic_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_clinic_reviews_updated_at
BEFORE UPDATE ON public.clinic_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_clinic_reviews_clinic_id ON public.clinic_reviews(clinic_id);
CREATE INDEX idx_clinic_reviews_user_id ON public.clinic_reviews(user_id);

-- Create a function to update clinic average rating
CREATE OR REPLACE FUNCTION public.update_clinic_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clinics
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.clinic_reviews
    WHERE clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
  )
  WHERE id = COALESCE(NEW.clinic_id, OLD.clinic_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update clinic rating on review changes
CREATE TRIGGER update_clinic_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.clinic_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_clinic_rating();
-- ================================================================
-- 20260117142346_b869062d-9dca-40e3-af06-6889ea0da109.sql
-- ================================================================
-- Add cover photo column to profiles table
ALTER TABLE public.profiles
ADD COLUMN cover_photo_url text DEFAULT NULL;
-- ================================================================
-- 20260117150656_8f010ef7-4e6f-439c-b8a9-5ec066e18b3e.sql
-- ================================================================
-- ============================================
-- SECURITY FIX: Protect Sensitive Doctor & Clinic Data
-- ============================================

-- ========== FIX 1: DOCTORS TABLE ==========
-- The doctors_public view already exists and excludes sensitive fields (email, phone, license_number, user_id)
-- We need to restrict direct access to the doctors table

-- Drop existing permissive policy
DROP POLICY IF EXISTS "Doctors are viewable by everyone" ON public.doctors;

-- Create restrictive policies for doctors table:

-- 1. Only authenticated users with legitimate roles can view full doctor details
CREATE POLICY "Doctors can view their own full profile"
ON public.doctors FOR SELECT
USING (auth.uid() = user_id);

-- 2. Clinic owners can view full details of their affiliated doctors
CREATE POLICY "Clinic owners can view their doctors"
ON public.doctors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clinic_doctors cd
    JOIN public.clinics c ON cd.clinic_id = c.id
    WHERE cd.doctor_id = doctors.id
    AND c.owner_user_id = auth.uid()
  )
);

-- 3. Admins can view all doctor details
CREATE POLICY "Admins can view all doctors"
ON public.doctors FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ========== FIX 2: CLINICS TABLE ==========
-- Create a public view that excludes sensitive verification documents

-- Drop existing view if it exists (to recreate with proper security)
DROP VIEW IF EXISTS public.clinics_public;

-- Create a public view that excludes sensitive document URLs and owner data
CREATE VIEW public.clinics_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  address,
  phone,
  email,
  description,
  image_url,
  cover_photo_url,
  opening_hours,
  services,
  rating,
  is_open,
  is_verified,
  distance,
  created_at
  -- Excludes: owner_user_id, owner_name, owner_nid, 
  -- bvc_certificate_url, trade_license_url, verification_status,
  -- verification_submitted_at, verification_reviewed_at,
  -- rejection_reason, is_blocked, blocked_at, blocked_reason
FROM public.clinics
WHERE is_blocked IS NOT TRUE;

-- Drop existing permissive policy on clinics
DROP POLICY IF EXISTS "Clinics are viewable by everyone" ON public.clinics;

-- Create restrictive policies for clinics table:

-- 1. Clinic owners can view their own full clinic details
CREATE POLICY "Clinic owners can view their own clinic"
ON public.clinics FOR SELECT
USING (owner_user_id = auth.uid());

-- 2. Admins can view all clinic details including documents
CREATE POLICY "Admins can view all clinics"
ON public.clinics FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Doctors affiliated with a clinic can view basic clinic info
CREATE POLICY "Affiliated doctors can view clinic"
ON public.clinics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clinic_doctors cd
    WHERE cd.clinic_id = clinics.id
    AND cd.doctor_id = public.get_doctor_id(auth.uid())
  )
);

-- Note: Public users should query clinics_public view instead of clinics table directly
-- The clinics_public view will inherit RLS but shows limited safe columns
-- ================================================================
-- 20260117153928_f3d0a20b-7d73-4b8a-9a54-1b4079a8b9e8.sql
-- ================================================================
-- Fix RLS Policy: Allow public/anonymous users to view non-blocked clinics
-- This is needed because clinics_public view uses security_invoker which inherits caller's permissions

-- Add policy for anonymous users to view non-blocked clinics
CREATE POLICY "Public can view non-blocked clinics"
ON public.clinics FOR SELECT
TO anon
USING (is_blocked IS NOT TRUE);

-- Add policy for authenticated users to view non-blocked clinics (in addition to other policies)
CREATE POLICY "Authenticated users can view non-blocked clinics"
ON public.clinics FOR SELECT
TO authenticated
USING (is_blocked IS NOT TRUE);
-- ================================================================
-- 20260117163755_83628684-3104-42e7-aefe-7b2993468ac8.sql
-- ================================================================
-- Add RLS policy to allow admins to update clinics
CREATE POLICY "Admins can update clinics"
ON public.clinics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
-- ================================================================
-- 20260117164606_995c1370-d118-4f22-ae66-08d772feeab1.sql
-- ================================================================
-- Add target_clinic_id column for clinic-related notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Enable realtime for immediate notification delivery
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- ================================================================
-- 20260117180049_359d6410-838d-49f8-97d5-69048fd33750.sql
-- ================================================================
-- Add RLS policy to allow authenticated users to read basic profile info (for displaying names in posts, comments, etc.)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ================================================================
-- 20260117182015_eacd70a1-e3ad-4585-b83d-83b22f3b0a2f.sql
-- ================================================================
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
-- ================================================================
-- 20260118073154_ba195aa8-0012-4f85-90c0-823b41f7604b.sql
-- ================================================================
-- Fix: Remove overly permissive policy that allows all authenticated users to view doctors
-- This policy exposes sensitive contact information (email, phone, license_number)
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON public.doctors;

-- Note: The following policies remain intact and provide proper access:
-- 1. "Doctors can view their own full profile" - doctor can see their own data
-- 2. "Clinic owners can view their doctors" - clinic owners can see doctors they work with
-- 3. "Admins can view all doctors" - admins have full access
-- 4. Public users should use doctors_public view which excludes sensitive fields

-- The doctors_public view already exists and excludes: email, phone, license_number, user_id
-- Application code correctly uses doctors_public for public-facing features
-- ================================================================
-- 20260123044444_9405a897-1c6f-48d4-9241-be38cb8a14fd.sql
-- ================================================================
-- Add verification fields to doctors table
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_submitted';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bvc_certificate_url TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS nid_number TEXT;

-- Create doctor join requests table
CREATE TABLE IF NOT EXISTS public.doctor_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  requested_by TEXT NOT NULL CHECK (requested_by IN ('doctor', 'clinic')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  UNIQUE(doctor_id, clinic_id)
);

-- Enable RLS on doctor_join_requests
ALTER TABLE public.doctor_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for doctor_join_requests
CREATE POLICY "Doctors can view their own requests"
ON public.doctor_join_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM doctors WHERE doctors.id = doctor_join_requests.doctor_id AND doctors.user_id = auth.uid()
));

CREATE POLICY "Doctors can create join requests"
ON public.doctor_join_requests FOR INSERT
WITH CHECK (
  requested_by = 'doctor' AND
  EXISTS (SELECT 1 FROM doctors WHERE doctors.id = doctor_join_requests.doctor_id AND doctors.user_id = auth.uid())
);

CREATE POLICY "Doctors can delete their pending requests"
ON public.doctor_join_requests FOR DELETE
USING (
  status = 'pending' AND
  EXISTS (SELECT 1 FROM doctors WHERE doctors.id = doctor_join_requests.doctor_id AND doctors.user_id = auth.uid())
);

CREATE POLICY "Clinic owners can view requests for their clinic"
ON public.doctor_join_requests FOR SELECT
USING (is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can update requests for their clinic"
ON public.doctor_join_requests FOR UPDATE
USING (is_clinic_owner(auth.uid(), clinic_id));

CREATE POLICY "Clinic owners can create invitations"
ON public.doctor_join_requests FOR INSERT
WITH CHECK (
  requested_by = 'clinic' AND
  is_clinic_owner(auth.uid(), clinic_id)
);

CREATE POLICY "Admins can view all requests"
ON public.doctor_join_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all requests"
ON public.doctor_join_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for doctor documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-documents', 'doctor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for doctor-documents bucket
CREATE POLICY "Doctors can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'doctor-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Doctors can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all doctor documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'doctor-documents' AND
  has_role(auth.uid(), 'admin')
);

-- Update avatars bucket policy for doctor avatars
CREATE POLICY "Authenticated users can upload doctor avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Doctor avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors'
);

CREATE POLICY "Authenticated users can update doctor avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete doctor avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'doctors' AND
  auth.role() = 'authenticated'
);

-- Create function to auto-link clinic-added doctors
CREATE OR REPLACE FUNCTION public.auto_link_clinic_doctor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by_clinic_id IS NOT NULL THEN
    INSERT INTO clinic_doctors (doctor_id, clinic_id, status)
    VALUES (NEW.id, NEW.created_by_clinic_id, 'active')
    ON CONFLICT (doctor_id, clinic_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-linking
DROP TRIGGER IF EXISTS on_doctor_created ON doctors;
CREATE TRIGGER on_doctor_created
AFTER INSERT ON doctors
FOR EACH ROW
EXECUTE FUNCTION auto_link_clinic_doctor();

-- Enable realtime for doctor_join_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_join_requests;
-- ================================================================
-- 20260123053234_e50f32d2-4bbd-4d95-9719-5237a8e2d61b.sql
-- ================================================================
-- Storage policies for doctor-documents bucket (if not exists pattern using DO block)
DO $$ 
BEGIN
  -- Insert policy for doctor-documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload doctor documents') THEN
    CREATE POLICY "Authenticated users can upload doctor documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Select policy for doctor-documents  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own doctor documents') THEN
    CREATE POLICY "Users can view their own doctor documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Update policy for doctor-documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own doctor documents') THEN
    CREATE POLICY "Users can update their own doctor documents"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Delete policy for doctor-documents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own doctor documents') THEN
    CREATE POLICY "Users can delete their own doctor documents"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'doctor-documents' AND auth.role() = 'authenticated');
  END IF;

  -- Upload policy for doctor avatars
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Clinic owners can upload doctor avatars') THEN
    CREATE POLICY "Clinic owners can upload doctor avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = 'doctors' AND
      auth.role() = 'authenticated'
    );
  END IF;
END $$;
-- ================================================================
-- 20260123053918_f1fbdc26-279c-4b09-a2aa-d6856de9757c.sql
-- ================================================================
-- Allow admins/public read for verification documents (for admin review)
-- Note: Using DO block to handle "already exists" gracefully
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view doctor documents') THEN
    CREATE POLICY "Public can view doctor documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'doctor-documents');
  END IF;
END $$;
-- ================================================================
-- 20260123060025_cb4e1f56-8edc-4e62-a71f-0d158a4f5029.sql
-- ================================================================
-- Add block fields to doctors table if not present
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS blocked_reason text;
-- ================================================================
-- 20260124041207_f40ade9a-fb37-44b3-9a81-008171b79f77.sql
-- ================================================================
-- Enable realtime for appointments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
-- ================================================================
-- 20260131041037_03871402-2153-467b-86e5-7c759729b74b.sql
-- ================================================================
-- Create contact_messages table for form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit contact messages
CREATE POLICY "Anyone can submit contact messages"
ON contact_messages FOR INSERT
WITH CHECK (true);

-- Only admins can read contact messages
CREATE POLICY "Admins can manage contact messages"
ON contact_messages FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- ================================================================
-- 20260202041611_b52c451f-4e30-4400-9392-af29a3c2cd30.sql
-- ================================================================
-- Performance indexes for common query patterns

-- Appointments performance indexes
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date 
ON appointments(clinic_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
ON appointments(doctor_id, appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_user_created 
ON appointments(user_id, created_at DESC);

-- Posts feed performance
CREATE INDEX IF NOT EXISTS idx_posts_pet_created 
ON posts(pet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user_created
ON posts(user_id, created_at DESC);

-- Likes performance
CREATE INDEX IF NOT EXISTS idx_likes_user_post 
ON likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_id
ON likes(post_id);

-- Orders performance
CREATE INDEX IF NOT EXISTS idx_orders_user_status 
ON orders(user_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_created
ON orders(created_at DESC);

-- Doctor search performance
CREATE INDEX IF NOT EXISTS idx_doctors_verified_available 
ON doctors(is_verified, is_available) WHERE is_verified = true AND is_blocked = false;

-- Clinic search performance
CREATE INDEX IF NOT EXISTS idx_clinics_verified_open
ON clinics(is_verified, is_open) WHERE is_verified = true AND is_blocked IS NOT TRUE;

-- Notifications performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, is_read, created_at DESC);

-- Messages performance  
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at);

-- Clinic doctors performance
CREATE INDEX IF NOT EXISTS idx_clinic_doctors_clinic_status
ON clinic_doctors(clinic_id, status);

-- Doctor schedules performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_clinic_doctor
ON doctor_schedules(clinic_id, doctor_id, day_of_week);
-- ================================================================
-- 20260205114040_6a4ad048-67a2-451d-b36d-506943ea5de0.sql
-- ================================================================

-- Drop and recreate the doctors_public view with security_invoker=off to allow public access
DROP VIEW IF EXISTS public.doctors_public;

CREATE VIEW public.doctors_public AS
SELECT 
  id,
  name,
  specialization,
  qualifications,
  experience_years,
  consultation_fee,
  is_available,
  is_verified,
  avatar_url,
  bio,
  created_at,
  updated_at,
  created_by_clinic_id
FROM public.doctors
WHERE is_blocked IS NOT TRUE;

-- Grant public select access to the view
GRANT SELECT ON public.doctors_public TO anon, authenticated;

-- ================================================================
-- 20260205120426_7d32e057-e501-4e06-9d74-a11d3ed9f430.sql
-- ================================================================
-- Create admin_settings table for persistent global configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Admins can read settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert/update settings
CREATE POLICY "Admins can manage settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('store', '{"name": "VET-MEDIX", "email": "support@vetmedix.com", "currency": "BDT", "taxRate": 0}'),
  ('notifications', '{"orderAlerts": true, "lowStockAlerts": true, "newCustomerAlerts": false, "emailNotifications": true}')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- ================================================================
-- 20260207070452_0180eda5-bbe7-4cdf-9653-86af061726d9.sql
-- ================================================================
-- Enable realtime for orders table so users see status changes immediately
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- ================================================================
-- 20260207073407_29987997-dc2d-4ba6-b0ad-02e6fd81ec36.sql
-- ================================================================
-- Add admin UPDATE and DELETE policies for doctors table
CREATE POLICY "Admins can update all doctors"
ON public.doctors
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all doctors"
ON public.doctors
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
-- ================================================================
-- 20260207084938_820c642b-9df2-4e21-9656-1c1dfd9d83aa.sql
-- ================================================================
-- Admin needs to view ALL profiles for analytics & user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin needs to view ALL appointments for analytics
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin needs to update appointments (e.g. manage status)
CREATE POLICY "Admins can update all appointments"
ON public.appointments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
-- ================================================================
-- 20260210053040_040cb2e7-740d-4f43-9db7-fc7b51860cf9.sql
-- ================================================================

-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read active coupons (for validation at checkout)
CREATE POLICY "Anyone can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for coupons
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;

-- ================================================================
-- 20260210053659_732c7887-c411-435b-9cb2-4ee5d66b90db.sql
-- ================================================================

-- Create wishlists table for persistent wishlist
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist" ON public.wishlists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to wishlist" ON public.wishlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can remove from wishlist" ON public.wishlists
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 20260211114734_54f8c325-b751-41de-a98a-a2f0f1e3ebe6.sql
-- ================================================================

-- Create clinic_favorites table
CREATE TABLE public.clinic_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

ALTER TABLE public.clinic_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clinic favorites" ON public.clinic_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add clinic favorites" ON public.clinic_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove clinic favorites" ON public.clinic_favorites FOR DELETE USING (auth.uid() = user_id);

-- Create doctor_favorites table
CREATE TABLE public.doctor_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, doctor_id)
);

ALTER TABLE public.doctor_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own doctor favorites" ON public.doctor_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add doctor favorites" ON public.doctor_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove doctor favorites" ON public.doctor_favorites FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- 20260214165310_48f2fe07-feab-47e0-9042-94e2268f6e9a.sql
-- ================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
-- ================================================================
-- 20260214171252_34434ae3-ed95-43e3-be85-b9116d84f5cd.sql
-- ================================================================
-- Fix doctors_public view: add security_invoker=on to match other public views
CREATE OR REPLACE VIEW public.doctors_public
WITH (security_invoker=on)
AS
SELECT id,
    name,
    specialization,
    qualifications,
    experience_years,
    consultation_fee,
    is_available,
    is_verified,
    avatar_url,
    bio,
    created_at,
    updated_at,
    created_by_clinic_id
   FROM doctors
  WHERE (is_blocked IS NOT TRUE);

-- Ensure proper grants
GRANT SELECT ON public.doctors_public TO anon;
GRANT SELECT ON public.doctors_public TO authenticated;
-- ================================================================
-- 20260214174038_3e770381-6918-4eef-b3f5-2e7b349be713.sql
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_doctors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;

-- ================================================================
-- 20260215113142_45c97d32-8808-49cd-bbbd-20489ea34511.sql
-- ================================================================

-- Add payment gateway readiness columns
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text;

-- ================================================================
-- 20260215121957_9b9baf20-0abb-473b-8974-d06d49d8223a.sql
-- ================================================================

CREATE TABLE public.incomplete_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  items jsonb DEFAULT '[]'::jsonb,
  cart_total numeric DEFAULT 0,
  shipping_address text,
  division text,
  completeness integer DEFAULT 0,
  status text DEFAULT 'incomplete',
  recovered_order_id uuid,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage incomplete orders"
  ON public.incomplete_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own incomplete orders"
  ON public.incomplete_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomplete orders"
  ON public.incomplete_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own incomplete orders"
  ON public.incomplete_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomplete orders"
  ON public.incomplete_orders FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_incomplete_orders_updated_at
  BEFORE UPDATE ON public.incomplete_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.incomplete_orders;

-- ================================================================
-- 20260215125211_4d18d179-f102-4096-a255-6c7da6f5b7a2.sql
-- ================================================================

-- New categories table
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  image_url text,
  product_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories"
  ON public.product_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories"
  ON public.product_categories FOR SELECT
  USING (is_active = true);

-- Seed existing categories
INSERT INTO public.product_categories (name, slug) VALUES
  ('Pet', 'pet'),
  ('Farm', 'farm');

-- Add new columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS compare_price numeric,
  ADD COLUMN IF NOT EXISTS sku text;

-- Enable realtime for categories
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_categories;

-- ================================================================
-- 20260215125925_8b808e1c-137e-4011-bace-19c25e4495c7.sql
-- ================================================================

-- Remove the check constraint on products.category that limits to 'Pet'/'Farm'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_check;

-- ================================================================
-- 20260215143632_5d020834-7e28-45ea-bb91-ecb30d93210d.sql
-- ================================================================

CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  charge NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT DEFAULT '3-5 days',
  is_active BOOLEAN DEFAULT true,
  divisions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delivery zones" ON public.delivery_zones FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active delivery zones" ON public.delivery_zones FOR SELECT USING (is_active = true);

CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_zones;

-- Seed default zones
INSERT INTO public.delivery_zones (zone_name, charge, delivery_fee, estimated_days, is_active, divisions)
VALUES 
  ('Dhaka Inside', 60, 60, '1-3 days', true, ARRAY['Dhaka']),
  ('Outside Dhaka', 120, 120, '3-5 days', true, ARRAY['Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh']);

-- ================================================================
-- 20260217042218_0b9c14b4-8a26-4276-a940-fb0bd54ea14a.sql
-- ================================================================

-- Add trashed_at column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add trashed_at column to incomplete_orders table
ALTER TABLE public.incomplete_orders ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_trashed_at ON public.orders (trashed_at);
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_trashed_at ON public.incomplete_orders (trashed_at);

-- Allow admins to delete orders (for permanent delete from trash)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete orders' AND tablename = 'orders'
  ) THEN
    CREATE POLICY "Admins can delete orders"
    ON public.orders
    FOR DELETE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- ================================================================
-- 20260217052958_613cb045-be82-42bd-8a35-412883ef9344.sql
-- ================================================================

-- Create a single RPC function that returns all admin dashboard stats in one call
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM products),
    'totalUsers', (SELECT count(*) FROM profiles),
    'totalClinics', (SELECT count(*) FROM clinics),
    'verifiedClinics', (SELECT count(*) FROM clinics WHERE is_verified = true),
    'totalDoctors', (SELECT count(*) FROM doctors),
    'pendingDoctors', (SELECT count(*) FROM doctors WHERE verification_status = 'pending'),
    'totalPosts', (SELECT count(*) FROM posts),
    'postsToday', (SELECT count(*) FROM posts WHERE created_at >= v_today::timestamptz),
    'totalAppointments', (SELECT count(*) FROM appointments),
    'appointmentsToday', (SELECT count(*) FROM appointments WHERE appointment_date = v_today),
    'totalOrders', (SELECT count(*) FROM orders WHERE trashed_at IS NULL),
    'pendingOrders', (SELECT count(*) FROM orders WHERE status = 'pending' AND trashed_at IS NULL),
    'cancelledOrders', (SELECT count(*) FROM orders WHERE status IN ('cancelled', 'rejected') AND trashed_at IS NULL),
    'activeRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE trashed_at IS NULL),
    'recentOrders', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
      SELECT id, total_amount, status, created_at
      FROM orders WHERE trashed_at IS NULL
      ORDER BY created_at DESC LIMIT 5
    ) o)
  ) INTO result;

  RETURN result;
END;
$$;

-- ================================================================
-- 20260217080412_04a40943-ed8a-4553-8ba7-83993cda5f8c.sql
-- ================================================================

-- ============================================================
-- CMS Tables, RLS, Storage, Triggers, Realtime
-- ============================================================

-- 1. cms_categories table
CREATE TABLE public.cms_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Anyone can view active cms categories"
  ON public.cms_categories FOR SELECT
  USING (is_active = true);

-- Admins can read all categories
CREATE POLICY "Admins can view all cms categories"
  ON public.cms_categories FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage categories
CREATE POLICY "Admins can insert cms categories"
  ON public.cms_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cms categories"
  ON public.cms_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cms categories"
  ON public.cms_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.cms_categories (name, slug, description) VALUES
  ('Health Tips', 'health-tips', 'Pet health advice and wellness tips'),
  ('Vet Care', 'vet-care', 'Veterinary care guides and information'),
  ('Announcements', 'announcements', 'Platform announcements and updates'),
  ('News', 'news', 'Pet industry news and updates');

-- 2. cms_articles table
CREATE TABLE public.cms_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published articles
CREATE POLICY "Anyone can view published articles"
  ON public.cms_articles FOR SELECT
  USING (status = 'published');

-- Admins can read all articles
CREATE POLICY "Admins can view all articles"
  ON public.cms_articles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert articles
CREATE POLICY "Admins can insert articles"
  ON public.cms_articles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update articles
CREATE POLICY "Admins can update articles"
  ON public.cms_articles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete articles
CREATE POLICY "Admins can delete articles"
  ON public.cms_articles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_cms_articles_updated_at
  BEFORE UPDATE ON public.cms_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for slug lookups and status filtering
CREATE INDEX idx_cms_articles_slug ON public.cms_articles (slug);
CREATE INDEX idx_cms_articles_status ON public.cms_articles (status);
CREATE INDEX idx_cms_articles_category ON public.cms_articles (category);
CREATE INDEX idx_cms_articles_published_at ON public.cms_articles (published_at DESC);

-- 3. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cms_articles;

-- 4. Storage bucket for CMS media
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-media', 'cms-media', true);

-- Storage RLS: Anyone can read
CREATE POLICY "Anyone can view cms media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-media');

-- Only admins can upload
CREATE POLICY "Admins can upload cms media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cms-media' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update cms media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cms-media' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete cms media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cms-media' AND public.has_role(auth.uid(), 'admin'));

-- 5. Update get_admin_dashboard_stats to include CMS counts
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM products),
    'totalUsers', (SELECT count(*) FROM profiles),
    'totalClinics', (SELECT count(*) FROM clinics),
    'verifiedClinics', (SELECT count(*) FROM clinics WHERE is_verified = true),
    'totalDoctors', (SELECT count(*) FROM doctors),
    'pendingDoctors', (SELECT count(*) FROM doctors WHERE verification_status = 'pending'),
    'totalPosts', (SELECT count(*) FROM posts),
    'postsToday', (SELECT count(*) FROM posts WHERE created_at >= v_today::timestamptz),
    'totalAppointments', (SELECT count(*) FROM appointments),
    'appointmentsToday', (SELECT count(*) FROM appointments WHERE appointment_date = v_today),
    'totalOrders', (SELECT count(*) FROM orders WHERE trashed_at IS NULL),
    'pendingOrders', (SELECT count(*) FROM orders WHERE status = 'pending' AND trashed_at IS NULL),
    'cancelledOrders', (SELECT count(*) FROM orders WHERE status IN ('cancelled', 'rejected') AND trashed_at IS NULL),
    'activeRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM orders WHERE trashed_at IS NULL),
    'recentOrders', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
      SELECT id, total_amount, status, created_at
      FROM orders WHERE trashed_at IS NULL
      ORDER BY created_at DESC LIMIT 5
    ) o),
    'totalArticles', (SELECT count(*) FROM cms_articles),
    'draftArticles', (SELECT count(*) FROM cms_articles WHERE status = 'draft'),
    'publishedThisMonth', (SELECT count(*) FROM cms_articles WHERE status = 'published' AND published_at >= date_trunc('month', now()))
  ) INTO result;

  RETURN result;
END;
$function$;

-- ================================================================
-- 20260217083536_a2abd977-a73c-499f-bdf4-876c781d231e.sql
-- ================================================================

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

-- ================================================================
-- 20260217094054_9ef33dbf-f228-4da4-b59d-e0e75dd9cdfd.sql
-- ================================================================

-- C1: Create atomic stock decrement function
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(stock - p_quantity, 0),
      badge = CASE WHEN stock - p_quantity <= 0 THEN 'Stock Out' ELSE badge END
  WHERE id = p_product_id;
END;
$$;

-- C2: Add unique constraint to prevent double-booking appointments
-- Using a partial unique index to handle NULL doctor_id properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking
ON public.appointments (clinic_id, appointment_date, appointment_time, doctor_id)
WHERE status NOT IN ('cancelled', 'rejected');

-- Also handle NULL doctor_id case (appointments without a specific doctor)
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_no_double_booking_no_doctor
ON public.appointments (clinic_id, appointment_date, appointment_time)
WHERE doctor_id IS NULL AND status NOT IN ('cancelled', 'rejected');

-- M3: Create atomic coupon increment function
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$;

-- ================================================================
-- 20260217101635_b771aa31-731e-4423-b484-49492cacaa67.sql
-- ================================================================

-- VULN-1: Atomic appointment booking function + partial unique index

-- Partial unique index to prevent double-bookings at DB level
-- Only active appointments (not cancelled/rejected) are constrained
CREATE UNIQUE INDEX idx_unique_active_appointment 
ON public.appointments (clinic_id, COALESCE(doctor_id, '00000000-0000-0000-0000-000000000000'::uuid), appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'rejected');

-- Atomic book appointment function
CREATE OR REPLACE FUNCTION public.book_appointment_atomic(
  p_user_id uuid,
  p_clinic_id uuid,
  p_doctor_id uuid DEFAULT NULL,
  p_appointment_date date DEFAULT NULL,
  p_appointment_time text DEFAULT NULL,
  p_pet_name text DEFAULT NULL,
  p_pet_type text DEFAULT NULL,
  p_reason text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_appointment_id uuid;
BEGIN
  -- Verify the caller is the user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Attempt insert; the unique index will reject duplicates
  INSERT INTO public.appointments (
    user_id, clinic_id, doctor_id, appointment_date, appointment_time,
    pet_name, pet_type, reason
  ) VALUES (
    p_user_id, p_clinic_id, p_doctor_id, p_appointment_date, p_appointment_time,
    p_pet_name, p_pet_type, p_reason
  )
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'This time slot is already booked. Please choose a different time.';
END;
$$;

-- VULN-2: Atomic order creation with stock decrement
CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL,
  p_payment_method text DEFAULT 'cod',
  p_coupon_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_current_stock int;
BEGIN
  -- Verify caller
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check stock for ALL items first (with row locks)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;  -- Row-level lock

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;

    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'name');
    END IF;
  END LOOP;

  -- Insert order
  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (p_user_id, p_items, p_total_amount, p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  -- Decrement stock for all items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  -- Increment coupon usage if applicable
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$$;

-- ================================================================
-- 20260217110624_147f7de0-eec4-4d2f-96f3-b0854930a28f.sql
-- ================================================================

-- CRIT-1: Drop overly permissive doctor-documents upload policy
DROP POLICY IF EXISTS "Authenticated users can upload doctor documents" ON storage.objects;

-- HIGH-4: Fix avatar delete policy - replace with scoped version
DROP POLICY IF EXISTS "Authenticated users can delete doctor avatars" ON storage.objects;
CREATE POLICY "Users can delete own doctor avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'doctors'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- CRIT-2: Add DELETE policies for conversations table
CREATE POLICY "Users can delete own conversations"
ON public.conversations FOR DELETE
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Admins can delete conversations"
ON public.conversations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- HIGH-1: Replace public clinic_doctors SELECT with authenticated-only policy
DROP POLICY IF EXISTS "Clinic doctors are viewable by everyone" ON public.clinic_doctors;
CREATE POLICY "Authenticated users can view clinic doctors"
ON public.clinic_doctors FOR SELECT
TO authenticated
USING (true);

-- ================================================================
-- 20260217110953_27adb141-204f-4189-a86a-7366e7f9045b.sql
-- ================================================================

-- SEC-2: DELETE policy for messages table (GDPR)
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- SEC-3: Restrict contact_messages INSERT to authenticated users
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit contact messages"
ON public.contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- SEC-4: DELETE policy for story_views (privacy)
CREATE POLICY "Users can delete their own story views"
ON public.story_views FOR DELETE
TO authenticated
USING (auth.uid() = viewer_user_id);

-- SEC-5: UPDATE/DELETE policies for reviews (user control)
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================================
-- 20260217111404_44db5e04-5a34-4c6c-a9e7-f3d24ffe95ad.sql
-- ================================================================

-- TRG-2: Notify clinic owner and doctor when appointment is booked
CREATE OR REPLACE FUNCTION public.notify_on_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_clinic_owner_id uuid;
  v_doctor_user_id uuid;
  v_clinic_name text;
BEGIN
  -- Get clinic owner
  SELECT owner_user_id, name INTO v_clinic_owner_id, v_clinic_name
  FROM public.clinics WHERE id = NEW.clinic_id;

  -- Notify clinic owner
  IF v_clinic_owner_id IS NOT NULL AND v_clinic_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, target_appointment_id, target_clinic_id)
    VALUES (
      v_clinic_owner_id,
      'appointment',
      '📅 New Appointment Booked',
      'A new appointment for ' || COALESCE(NEW.pet_name, 'a pet') || ' on ' || NEW.appointment_date::text || ' at ' || NEW.appointment_time,
      NEW.id,
      NEW.clinic_id
    );
  END IF;

  -- Notify assigned doctor
  IF NEW.doctor_id IS NOT NULL THEN
    SELECT user_id INTO v_doctor_user_id FROM public.doctors WHERE id = NEW.doctor_id;
    IF v_doctor_user_id IS NOT NULL AND v_doctor_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, target_appointment_id, target_clinic_id)
      VALUES (
        v_doctor_user_id,
        'appointment',
        '📅 New Patient Appointment',
        'You have a new appointment for ' || COALESCE(NEW.pet_name, 'a pet') || ' on ' || NEW.appointment_date::text || ' at ' || NEW.appointment_time,
        NEW.id,
        NEW.clinic_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_appointment();

-- TRG-3: Notify all admins when a new order is placed
CREATE OR REPLACE FUNCTION public.notify_admin_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_user_id uuid;
BEGIN
  FOR v_admin_user_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    IF v_admin_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, title, message, target_order_id)
      VALUES (
        v_admin_user_id,
        'order',
        '🛒 New Order Received',
        'New order #' || LEFT(NEW.id::text, 8) || ' for ৳' || NEW.total_amount::text,
        NEW.id
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_new_order();

-- TRG-4: Notify user when their order status changes
CREATE OR REPLACE FUNCTION public.notify_user_on_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_title text;
  v_message text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'accepted' THEN
        v_title := '✅ Order Accepted';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been accepted and is being processed.';
      WHEN 'shipped' THEN
        v_title := '🚚 Order Shipped';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been shipped!';
      WHEN 'delivered' THEN
        v_title := '📦 Order Delivered';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been delivered. Enjoy!';
      WHEN 'rejected' THEN
        v_title := '❌ Order Rejected';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' was rejected.' || COALESCE(' Reason: ' || NEW.rejection_reason, '');
      WHEN 'cancelled' THEN
        v_title := '🚫 Order Cancelled';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' has been cancelled.';
      ELSE
        v_title := '📋 Order Updated';
        v_message := 'Your order #' || LEFT(NEW.id::text, 8) || ' status changed to ' || NEW.status;
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, message, target_order_id)
    VALUES (NEW.user_id, 'order', v_title, v_message, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_user_on_order_update
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_order_update();

-- ================================================================
-- 20260217113502_3f13f88a-0824-4e82-9db9-d6358e487735.sql
-- ================================================================

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

-- ================================================================
-- 20260219154038_42aca560-be8c-4b2c-8ab3-62104804d271.sql
-- ================================================================

-- Create the site_assets storage bucket for logo and favicon uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site_assets',
  'site_assets',
  true,
  5242880,
  ARRAY['image/png','image/jpeg','image/svg+xml','image/webp','image/x-icon','image/vnd.microsoft.icon']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS: public read (anyone can see brand assets)
CREATE POLICY "Public can view site assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site_assets');

-- RLS: only admins can upload/manage site assets
CREATE POLICY "Admins can upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site_assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update site assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'site_assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete site assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site_assets'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ================================================================
-- 20260220060453_2b2fa017-eb60-4fa4-a7c3-feeb538e0d2b.sql
-- ================================================================

-- Fix: Change RESTRICTIVE INSERT policies on doctors to PERMISSIVE
-- so that clinic owners OR self-registering doctors can insert.

-- Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create their own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Clinic owners can create doctors for their clinic" ON public.doctors;

-- Recreate as PERMISSIVE (default) so ANY matching policy allows the insert
CREATE POLICY "Users can create their own doctor profile"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clinic owners can create doctors for their clinic"
ON public.doctors
FOR INSERT
TO authenticated
WITH CHECK (
  (created_by_clinic_id IS NOT NULL)
  AND (EXISTS (
    SELECT 1 FROM clinics
    WHERE clinics.id = doctors.created_by_clinic_id
      AND clinics.owner_user_id = auth.uid()
  ))
);

-- ================================================================
-- 20260220061538_3c4a68ff-aa93-4ddb-9015-b1b2d2f89f76.sql
-- ================================================================

-- Drop the two restrictive INSERT policies
DROP POLICY IF EXISTS "Users can create their own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Clinic owners can create doctors for their clinic" ON public.doctors;

-- Recreate as PERMISSIVE — only ONE needs to pass
CREATE POLICY "Users can create their own doctor profile"
ON public.doctors
AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clinic owners can create doctors for their clinic"
ON public.doctors
AS PERMISSIVE
FOR INSERT TO authenticated
WITH CHECK (
  created_by_clinic_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.clinics
    WHERE clinics.id = doctors.created_by_clinic_id
    AND clinics.owner_user_id = auth.uid()
  )
);

-- ================================================================
-- 20260221053043_54ab1f4b-b054-429d-929d-a5fa6dba1da9.sql
-- ================================================================

-- Clean orphaned rows where user_id references deleted auth users
DELETE FROM public.likes WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.comments WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.follows WHERE follower_user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.stories WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.appointment_waitlist WHERE user_id NOT IN (SELECT id FROM auth.users);

-- ================================================================
-- 20260221053052_20563c61-1579-4ee2-854e-0fcb1ef3d194.sql
-- ================================================================

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

-- ================================================================
-- 20260223151739_a062d592-3576-4543-bdaa-863b048cca77.sql
-- ================================================================
-- Enable realtime for user_roles so role changes are pushed to connected clients
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
-- ================================================================
-- 20260224091004_15375277-a4a7-46ff-b15b-7287ae36c2a4.sql
-- ================================================================

-- Support chat tables (separate from social messaging)
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at);

-- RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users see own, admins see all
CREATE POLICY "Users can view own support conversations"
  ON public.support_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support conversations"
  ON public.support_conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own support conversations"
  ON public.support_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update support conversations"
  ON public.support_conversations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own support conversations"
  ON public.support_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Messages: users see messages in own conversations, admins see all
CREATE POLICY "Users can view messages in own conversations"
  ON public.support_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = support_messages.conversation_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all support messages"
  ON public.support_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can send messages in own conversations"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.support_conversations
      WHERE id = support_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can send messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update support messages"
  ON public.support_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Update conversation timestamp trigger
CREATE OR REPLACE FUNCTION public.update_support_conversation_timestamp()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_support_conv_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_support_conversation_timestamp();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;

-- ================================================================
-- 20260224095953_dcc3df70-fe84-4738-a0f2-8050ff900950.sql
-- ================================================================
-- Fix: product_categories SELECT policy must be PERMISSIVE so non-admin users can read categories
-- Drop the existing restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;
CREATE POLICY "Anyone can view active categories"
  ON public.product_categories
  FOR SELECT
  USING (is_active = true);

-- Also fix the admin ALL policy to be permissive
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;
CREATE POLICY "Admins can manage categories"
  ON public.product_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
-- ================================================================
-- 20260224101024_f33f0840-7643-459b-a0b9-25160ee3f222.sql
-- ================================================================

-- P0: Fix sender_role spoofing on support_messages
-- Enforce that non-admin users MUST set sender_role = 'user'
DROP POLICY IF EXISTS "Users can send messages in own conversations" ON public.support_messages;
CREATE POLICY "Users can send messages in own conversations"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_role = 'user'
    AND EXISTS (
      SELECT 1 FROM support_conversations
      WHERE id = support_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Admin policy already enforces has_role + sender_id match, but let's also enforce sender_role = 'admin'
DROP POLICY IF EXISTS "Admins can send messages" ON public.support_messages;
CREATE POLICY "Admins can send messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_role = 'admin'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- P1: Tighten contact_messages INSERT to enforce status = 'unread'
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit contact form"
  ON public.contact_messages FOR INSERT
  TO authenticated
  WITH CHECK (status = 'unread');

-- ================================================================
-- 20260304093314_a7719675-5f60-42d4-a57e-3764421ce84f.sql
-- ================================================================
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
-- ================================================================
-- 20260304095430_7705c97c-4c72-4330-aced-93fda6029e87.sql
-- ================================================================
-- Fix: The INSERT policies on doctors are RESTRICTIVE, which means they can NEVER
-- grant access (PostgreSQL requires at least one PERMISSIVE policy). 
-- Drop and recreate them as PERMISSIVE.

DROP POLICY IF EXISTS "Users can create their own doctor profile" ON public.doctors;
DROP POLICY IF EXISTS "Clinic owners can create doctors for their clinic" ON public.doctors;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can create their own doctor profile"
  ON public.doctors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clinic owners can create doctors for their clinic"
  ON public.doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    (created_by_clinic_id IS NOT NULL) AND 
    (EXISTS (
      SELECT 1 FROM clinics 
      WHERE clinics.id = doctors.created_by_clinic_id 
        AND clinics.owner_user_id = auth.uid()
    ))
  );
-- ================================================================
-- 20260304103359_b495e13b-a5a1-4f08-b319-26147d0444db.sql
-- ================================================================

-- Add DELETE policy for admins on support_conversations
CREATE POLICY "Admins can delete support conversations"
  ON public.support_conversations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for admins on support_messages
CREATE POLICY "Admins can delete support messages"
  ON public.support_messages FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure CASCADE on the FK so deleting a conversation removes its messages
ALTER TABLE public.support_messages
  DROP CONSTRAINT IF EXISTS support_messages_conversation_id_fkey,
  ADD CONSTRAINT support_messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.support_conversations(id) ON DELETE CASCADE;

-- ================================================================
-- 20260308074949_7a911be8-942c-456e-b628-c308946b6a72.sql
-- ================================================================
-- 1. CRITICAL: Fix privilege escalation - restrict self-role-insert to 'user' only
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'user'::app_role
    AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid())
  );

-- 2. CRITICAL: Remove broad clinics SELECT policies that expose sensitive data
DROP POLICY IF EXISTS "Authenticated users can view non-blocked clinics" ON public.clinics;
DROP POLICY IF EXISTS "Public can view non-blocked clinics" ON public.clinics;
-- ================================================================
-- 20260308075830_f3a659a4-23d7-42e4-b142-7c06c20a657a.sql
-- ================================================================
-- Fix notification injection vulnerability
-- Remove the pet-actor branch that allows targeting any user_id
-- Social notifications (like/comment/follow) should be moved to DB triggers
-- For now, restrict client INSERT to self-notifications only
DROP POLICY IF EXISTS "Users can create valid notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- ================================================================
-- 20260308075900_f09f3be1-b02c-4782-82cb-62abf15d4859.sql
-- ================================================================
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
-- ================================================================
-- 20260308093834_dc848c58-0c28-4e6c-8881-3e1b23752fee.sql
-- ================================================================

-- #2: Tighten contact_messages INSERT to enforce status='unread'
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (status = 'unread');

-- #6: Fix product_categories policies from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage categories" ON public.product_categories;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.product_categories;

CREATE POLICY "Admins can manage categories"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active categories"
  ON public.product_categories
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ================================================================
-- 20260418095928_f4ead69d-a23b-45d5-9d9d-12a6a246491e.sql
-- ================================================================
-- Courses table for the LMS
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  video_url TEXT,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses"
  ON public.courses FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
  ON public.courses FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.courses FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments"
  ON public.enrollments FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can enroll themselves"
  ON public.enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON public.enrollments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own enrollments"
  ON public.enrollments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_courses_active ON public.courses(is_active) WHERE is_active = true;
-- ================================================================
-- 20260418101028_33121510-8afb-4b9d-9098-61a6818b8149.sql
-- ================================================================
-- Phase 2: Cohort-based training courses

-- 1. Extend courses table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS duration_label text,
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS curriculum jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS whatsapp_message text,
  ADD COLUMN IF NOT EXISTS provides_certificate boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS language text DEFAULT 'bn';

-- 2. Create course_batches table
CREATE TABLE IF NOT EXISTS public.course_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date,
  end_date date,
  total_seats integer DEFAULT 30,
  enrolled_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_batches_course_id ON public.course_batches(course_id);
CREATE INDEX IF NOT EXISTS idx_course_batches_start_date ON public.course_batches(start_date);

ALTER TABLE public.course_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view batches"
  ON public.course_batches FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert batches"
  ON public.course_batches FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update batches"
  ON public.course_batches FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete batches"
  ON public.course_batches FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_course_batches_updated_at
  BEFORE UPDATE ON public.course_batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Extend enrollments table
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.course_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 4. Allow admins to view all enrollments (for callback queue)
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
CREATE POLICY "Admins can view all enrollments"
  ON public.enrollments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;
CREATE POLICY "Admins can update enrollments"
  ON public.enrollments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Seed admin setting for global WhatsApp number
INSERT INTO public.admin_settings (key, value)
VALUES ('whatsapp_number', '"+8801763585500"'::jsonb)
ON CONFLICT (key) DO NOTHING;
-- ================================================================
-- 20260418112343_78b2005b-3ad0-49f5-8afa-72b644b05ecf.sql
-- ================================================================
-- ═══════════════════════════════════════════════════════════════
-- Z AGRO TECH — LEGACY VET-MEDIX DEMOLITION (v3)
-- ═══════════════════════════════════════════════════════════════

-- 1. DROP DEPENDENT VIEWS
DROP VIEW IF EXISTS public.clinics_public CASCADE;
DROP VIEW IF EXISTS public.doctors_public CASCADE;

-- 2. DROP LEGACY FUNCTIONS
DROP FUNCTION IF EXISTS public.notify_on_new_appointment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_waitlist_on_cancellation() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_waitlist_position() CASCADE;
DROP FUNCTION IF EXISTS public.book_appointment_atomic(uuid, uuid, uuid, date, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.is_clinic_owner(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_doctor_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_clinic_rating() CASCADE;
DROP FUNCTION IF EXISTS public.auto_link_clinic_doctor() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_comment() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_like() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_follow() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_comments_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_post_likes_count() CASCADE;
DROP FUNCTION IF EXISTS public.increment_story_views() CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_support_conversation_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.check_pet_limit() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.notify_admin_on_new_order() CASCADE;
DROP FUNCTION IF EXISTS public.notify_user_on_order_update() CASCADE;

-- 3. DROP LEGACY TABLES
DROP TABLE IF EXISTS public.appointment_waitlist CASCADE;
DROP TABLE IF EXISTS public.doctor_join_requests CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;
DROP TABLE IF EXISTS public.doctor_favorites CASCADE;
DROP TABLE IF EXISTS public.clinic_doctors CASCADE;
DROP TABLE IF EXISTS public.clinic_services CASCADE;
DROP TABLE IF EXISTS public.clinic_reviews CASCADE;
DROP TABLE IF EXISTS public.clinic_favorites CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.pets CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.support_conversations CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE;
DROP TABLE IF EXISTS public.cms_articles CASCADE;
DROP TABLE IF EXISTS public.cms_categories CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 4. SWAP app_role enum — drop dependent policies/functions first
DO $$
DECLARE pol_name text;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='user_roles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol_name);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;

ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
UPDATE public.user_roles SET role = 'user' WHERE role NOT IN ('admin', 'user');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- 5. RECREATE has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. RECREATE user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can self-assign user role" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'user');

-- 7. RECREATE policies on tables that depended on the old has_role
DROP POLICY IF EXISTS "Admins can manage settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admins can read settings" ON public.admin_settings;
CREATE POLICY "Admins can manage settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage delivery zones" ON public.delivery_zones;
CREATE POLICY "Admins can manage delivery zones" ON public.delivery_zones
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view active courses" ON public.courses
  FOR SELECT USING ((is_active = true) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete batches" ON public.course_batches;
DROP POLICY IF EXISTS "Admins can insert batches" ON public.course_batches;
DROP POLICY IF EXISTS "Admins can update batches" ON public.course_batches;
CREATE POLICY "Admins manage batches" ON public.course_batches
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments" ON public.enrollments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own enrollments" ON public.enrollments
  FOR SELECT USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage incomplete orders" ON public.incomplete_orders;
CREATE POLICY "Admins manage incomplete orders" ON public.incomplete_orders
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. REWRITE get_admin_dashboard_stats for Z Agro Tech only
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM public.products),
    'activeProducts', (SELECT count(*) FROM public.products WHERE is_active = true),
    'lowStockProducts', (SELECT count(*) FROM public.products WHERE stock IS NOT NULL AND stock <= 5),
    'totalUsers', (SELECT count(*) FROM public.profiles),
    'newUsersToday', (SELECT count(*) FROM public.profiles WHERE created_at >= v_today::timestamptz),
    'totalOrders', (SELECT count(*) FROM public.orders WHERE trashed_at IS NULL),
    'pendingOrders', (SELECT count(*) FROM public.orders WHERE status = 'pending' AND trashed_at IS NULL),
    'cancelledOrders', (SELECT count(*) FROM public.orders WHERE status IN ('cancelled', 'rejected') AND trashed_at IS NULL),
    'ordersToday', (SELECT count(*) FROM public.orders WHERE created_at >= v_today::timestamptz AND trashed_at IS NULL),
    'activeRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE trashed_at IS NULL),
    'revenueToday', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE created_at >= v_today::timestamptz AND trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalCourses', (SELECT count(*) FROM public.courses WHERE is_active = true),
    'totalEnrollments', (SELECT count(*) FROM public.enrollments),
    'pendingEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'pending'),
    'unreadMessages', (SELECT count(*) FROM public.contact_messages WHERE status = 'unread'),
    'incompleteOrders', (SELECT count(*) FROM public.incomplete_orders WHERE status = 'incomplete' AND trashed_at IS NULL),
    'recentOrders', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
      SELECT id, total_amount, status, created_at
      FROM public.orders WHERE trashed_at IS NULL
      ORDER BY created_at DESC LIMIT 5
    ) o)
  ) INTO result;

  RETURN result;
END;
$$;
-- ================================================================
-- 20260418114911_93d85fec-8f3b-493c-a9c0-05f327290e1c.sql
-- ================================================================
-- =========================================================================
-- Sprint 4 — Auth + RLS hardening sweep (Z Agro Tech) — rev 2
-- (Storage bucket deletion handled separately via Supabase dashboard)
-- =========================================================================

-- 1. Drop ALL legacy storage RLS policies referencing dead buckets
DROP POLICY IF EXISTS "Anyone can view cms media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pet media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload pet media" ON storage.objects;
DROP POLICY IF EXISTS "Clinic images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can upload doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can upload their documents" ON storage.objects;
DROP POLICY IF EXISTS "Clinic owners can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctor avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view doctor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own doctor avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own doctor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own pet media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own doctor documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own pet media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own doctor documents" ON storage.objects;

-- 2. Dedupe contact_messages INSERT policies
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'unread');

-- 3. Tighten storage upload policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar (scoped)"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- PRODUCT-IMAGES bucket — admin-only mutations
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- SITE_ASSETS bucket — admin-only mutations
DROP POLICY IF EXISTS "Admins can upload site assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site assets" ON storage.objects;

CREATE POLICY "Admins can upload site assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site_assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site_assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site_assets' AND public.has_role(auth.uid(), 'admin'));

-- 4. Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ================================================================
-- 20260418123523_75071c87-c34d-4c95-bd75-5ea9361137ca.sql
-- ================================================================
-- Enforce single-admin policy at the database level.
-- Only nijhumislam570@gmail.com may hold the 'admin' role.

CREATE OR REPLACE FUNCTION public.enforce_single_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.role = 'admin'::public.app_role THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    IF v_email IS DISTINCT FROM 'nijhumislam570@gmail.com' THEN
      RAISE EXCEPTION 'Only nijhumislam570@gmail.com may hold the admin role (attempted: %)', COALESCE(v_email, '<unknown>');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_admin();
-- ================================================================
-- 20260418124051_d001c851-87b2-4738-beec-ad09e2e200f5.sql
-- ================================================================
-- 1. coupons: drop public read
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- 2. products: hide inactive rows from public
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Active products are viewable by everyone"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. incomplete_orders: restrict user policies to authenticated role
DROP POLICY IF EXISTS "Users can view own incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Users can insert own incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Users can update own incomplete orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Users can delete own incomplete orders" ON public.incomplete_orders;

CREATE POLICY "Users can view own incomplete orders"
ON public.incomplete_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incomplete orders"
ON public.incomplete_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incomplete orders"
ON public.incomplete_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own incomplete orders"
ON public.incomplete_orders
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
-- ================================================================
-- 20260418130641_f781f59e-8fbe-4423-bd0f-e6c7c3a40a3a.sql
-- ================================================================
-- HIGH-FIX-1: Re-attach single-admin enforcement trigger on user_roles
DROP TRIGGER IF EXISTS enforce_single_admin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_admin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_single_admin();

-- HIGH-FIX-2: Allow authenticated users to read active, non-expired coupons
-- (so the checkout coupon validator works for normal customers)
DROP POLICY IF EXISTS "Authenticated users can read active coupons" ON public.coupons;
CREATE POLICY "Authenticated users can read active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (starts_at IS NULL OR starts_at <= now())
  AND (expires_at IS NULL OR expires_at > now())
);

-- HIGH-FIX-3: Drop legacy empty Vetmedix buckets (silences storage linter & removes
-- public file enumeration surface). Wrapped to skip if not present.
DO $$
DECLARE
  b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['pet-media','clinic-images','clinic-documents','doctor-documents','cms-media']
  LOOP
    BEGIN
      DELETE FROM storage.objects WHERE bucket_id = b;
      DELETE FROM storage.buckets WHERE id = b;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping bucket %: %', b, SQLERRM;
    END;
  END LOOP;
END $$;

-- HIGH-FIX-4a: Cleanup function for expired incomplete_orders.
-- A scheduled cron will be wired separately via the insert tool (user-specific URL/key).
CREATE OR REPLACE FUNCTION public.cleanup_expired_incomplete_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.incomplete_orders
  WHERE expires_at IS NOT NULL
    AND expires_at < now()
    AND status <> 'recovered';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_incomplete_orders() FROM PUBLIC, anon, authenticated;
-- ================================================================
-- 20260418131706_b34429fc-ccec-4cdd-95e5-636745564b4b.sql
-- ================================================================
-- Block A: dedicated public bucket for course thumbnails with admin-write RLS
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Course thumbnails are publicly readable" ON storage.objects;
CREATE POLICY "Course thumbnails are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- Admin-only write/update/delete
DROP POLICY IF EXISTS "Admins can upload course thumbnails" ON storage.objects;
CREATE POLICY "Admins can upload course thumbnails"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update course thumbnails" ON storage.objects;
CREATE POLICY "Admins can update course thumbnails"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete course thumbnails" ON storage.objects;
CREATE POLICY "Admins can delete course thumbnails"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-thumbnails' AND public.has_role(auth.uid(), 'admin'::public.app_role));
-- ================================================================
-- 20260418131945_8830b350-6a03-4609-9f2e-40858b8727d1.sql
-- ================================================================
-- Extend get_admin_dashboard_stats with completed/confirmed enrollment counts
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'totalProducts', (SELECT count(*) FROM public.products),
    'activeProducts', (SELECT count(*) FROM public.products WHERE is_active = true),
    'lowStockProducts', (SELECT count(*) FROM public.products WHERE stock IS NOT NULL AND stock <= 5),
    'totalUsers', (SELECT count(*) FROM public.profiles),
    'newUsersToday', (SELECT count(*) FROM public.profiles WHERE created_at >= v_today::timestamptz),
    'totalOrders', (SELECT count(*) FROM public.orders WHERE trashed_at IS NULL),
    'pendingOrders', (SELECT count(*) FROM public.orders WHERE status = 'pending' AND trashed_at IS NULL),
    'cancelledOrders', (SELECT count(*) FROM public.orders WHERE status IN ('cancelled', 'rejected') AND trashed_at IS NULL),
    'ordersToday', (SELECT count(*) FROM public.orders WHERE created_at >= v_today::timestamptz AND trashed_at IS NULL),
    'activeRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalRevenue', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE trashed_at IS NULL),
    'revenueToday', (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE created_at >= v_today::timestamptz AND trashed_at IS NULL AND status NOT IN ('cancelled', 'rejected')),
    'totalCourses', (SELECT count(*) FROM public.courses WHERE is_active = true),
    'totalEnrollments', (SELECT count(*) FROM public.enrollments),
    'pendingEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'pending'),
    'confirmedEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'confirmed'),
    'completedEnrollments', (SELECT count(*) FROM public.enrollments WHERE status = 'completed'),
    'unreadMessages', (SELECT count(*) FROM public.contact_messages WHERE status = 'unread'),
    'incompleteOrders', (SELECT count(*) FROM public.incomplete_orders WHERE status = 'incomplete' AND trashed_at IS NULL),
    'recentOrders', (SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) FROM (
      SELECT id, total_amount, status, created_at
      FROM public.orders WHERE trashed_at IS NULL
      ORDER BY created_at DESC LIMIT 5
    ) o)
  ) INTO result;

  RETURN result;
END;
$function$;
-- ================================================================
-- 20260418150403_54e16b70-b4a9-4569-8506-6271074467cb.sql
-- ================================================================
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
-- ================================================================
-- 20260419033026_1688187d-b9e0-4f27-b2ca-e887e56153ee.sql
-- ================================================================
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

CREATE POLICY "Authenticated users can view reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (true);
-- ================================================================
-- 20260419034818_b88868ca-a2d9-4b4d-9509-397501de9a6b.sql
-- ================================================================
-- Admin full access on products
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin full access on product_categories
CREATE POLICY "Admins can manage product categories"
ON public.product_categories
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
-- ================================================================
-- 20260419050013_f1cc670c-e432-4a62-b715-87e59173967f.sql
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments (status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_unread ON public.contact_messages (status) WHERE status = 'unread';
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
-- ================================================================
-- 20260419050721_c00564ce-12d8-4f84-938b-ace5aaee5960.sql
-- ================================================================
-- Performance indexes for Admin Products page
-- Speeds up low-stock filter, SKU lookups, and product_type search

-- Partial index for low-stock queries (admin alerts, badge sync)
CREATE INDEX IF NOT EXISTS idx_products_low_stock
  ON public.products (stock)
  WHERE stock IS NOT NULL AND stock <= 10;

-- SKU lookups for admin search (case-insensitive prefix matching)
CREATE INDEX IF NOT EXISTS idx_products_sku_lower
  ON public.products (lower(sku))
  WHERE sku IS NOT NULL;

-- Product type filter (used in admin search + storefront facets)
CREATE INDEX IF NOT EXISTS idx_products_product_type
  ON public.products (product_type)
  WHERE product_type IS NOT NULL;
-- ================================================================
-- 20260419051026_61b50ef4-7e94-4f7a-a154-a49c1f63c362.sql
-- ================================================================
-- Speeds up the admin E-Commerce Customers page filters & bulk updates
-- Partial index — only non-null, non-default payment_status rows
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_active
  ON public.orders (payment_status, user_id)
  WHERE payment_status IS NOT NULL;

-- Speeds up role lookups by (user_id, role) — used for admin checks and updates
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role
  ON public.user_roles (user_id, role);
-- ================================================================
-- 20260419051435_5de17311-faf1-4596-a173-927036b50478.sql
-- ================================================================
-- Speed up course batch lookups (loaded every time admin opens the Batches sheet)
CREATE INDEX IF NOT EXISTS idx_course_batches_course_start
  ON public.course_batches (course_id, start_date DESC NULLS LAST);

-- Speed up admin course listing — supports the default "newest first" ordering
CREATE INDEX IF NOT EXISTS idx_courses_active_created
  ON public.courses (is_active, created_at DESC);
-- ================================================================
-- 20260419065912_1c8bc648-7534-4199-b6a8-8a23fe73802a.sql
-- ================================================================
-- 1) Store the protected admin's user_id in admin_settings (no hardcoded email in code)
INSERT INTO public.admin_settings (key, value)
SELECT 'protected_admin_user_id', to_jsonb(u.id::text)
FROM auth.users u
WHERE u.email = 'nijhumislam570@gmail.com'
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 2) Helper RPC so the edge function (service-role) can read the protected ID
CREATE OR REPLACE FUNCTION public.get_protected_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (value #>> '{}')::uuid FROM public.admin_settings WHERE key = 'protected_admin_user_id'
$$;

-- 3) Harden create_order_with_stock: recalculate price server-side
CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL,
  p_payment_method text DEFAULT 'cod',
  p_coupon_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_current_stock int;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_division text;
  v_delivery_charge numeric := 120; -- fallback
  v_discount numeric := 0;
  v_coupon record;
  v_verified_total numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock products + recalc subtotal from server-side prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT stock, price INTO v_current_stock, v_unit_price
    FROM public.products
    WHERE id = v_product_id AND is_active = true
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'name');
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  -- Resolve delivery charge from shipping_address last segment (division)
  v_division := trim(split_part(COALESCE(p_shipping_address, ''), ',', -1));
  IF v_division <> '' THEN
    SELECT charge INTO v_delivery_charge
    FROM public.delivery_zones
    WHERE is_active = true AND v_division = ANY(divisions)
    LIMIT 1;
    IF v_delivery_charge IS NULL THEN
      v_delivery_charge := 120;
    END IF;
  END IF;

  -- Validate + apply coupon server-side
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons
    WHERE id = p_coupon_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
      AND (usage_limit IS NULL OR used_count < usage_limit)
      AND (min_order_amount IS NULL OR v_subtotal >= min_order_amount);

    IF v_coupon.id IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired coupon';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := v_subtotal * (v_coupon.discount_value / 100);
      IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
      END IF;
    ELSE
      v_discount := v_coupon.discount_value;
    END IF;
    v_discount := LEAST(v_discount, v_subtotal);
  END IF;

  v_verified_total := v_subtotal + v_delivery_charge - v_discount;

  -- Reject if client-supplied total deviates by more than ৳1 (rounding tolerance)
  IF abs(v_verified_total - p_total_amount) > 1 THEN
    RAISE EXCEPTION 'Order total mismatch (expected %, got %)', v_verified_total, p_total_amount;
  END IF;

  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (p_user_id, p_items, v_verified_total, p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);
    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$$;
-- ================================================================
-- 20260423125355_765186f5-0cdc-4a80-9930-f7d831d984e7.sql
-- ================================================================

-- 1. Aggregated product_ratings view: replaces the N+1 review-row fetches
--    that ShopPage and ProductDetailPage do today.
CREATE OR REPLACE VIEW public.product_ratings
WITH (security_invoker = true)
AS
SELECT
  p.id AS product_id,
  COALESCE(AVG(r.rating)::numeric(10,2), 0)::numeric AS avg_rating,
  COALESCE(COUNT(r.id), 0)::int AS review_count
FROM public.products p
LEFT JOIN public.reviews r ON r.product_id = p.id
GROUP BY p.id;

-- Allow anonymous + authenticated users to read aggregated ratings.
-- Reviews table itself remains authenticated-only; this view exposes
-- only counts + averages, no PII.
GRANT SELECT ON public.product_ratings TO anon, authenticated;

-- 2. Public order tracking RPC: returns sanitized status fields keyed by
--    a known tracking_id. Customer can paste the code without logging in.
--    Exposes ONLY: id (for the realtime channel), status, tracking_id,
--    consignment_id, created_at, rejection_reason. No items/total/address.
CREATE OR REPLACE FUNCTION public.get_order_tracking_summary(p_tracking_id text)
RETURNS TABLE (
  id uuid,
  status text,
  tracking_id text,
  consignment_id text,
  rejection_reason text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.status,
    o.tracking_id,
    o.consignment_id,
    o.rejection_reason,
    o.created_at
  FROM public.orders o
  WHERE o.tracking_id IS NOT NULL
    AND o.tracking_id = p_tracking_id
    AND o.trashed_at IS NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking_summary(text) TO anon, authenticated;

-- ================================================================
-- 20260423130515_bf2057cd-55d8-4488-9c1f-6c42e084588c.sql
-- ================================================================
-- Aggregated view: returns the next "open" or "filling" batch per course.
-- Powers academy CourseCard without per-card useCourseBatches() calls.
CREATE OR REPLACE VIEW public.course_next_batch
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (b.course_id)
  b.course_id,
  b.id AS batch_id,
  b.name,
  b.start_date,
  b.end_date,
  b.status,
  b.total_seats,
  b.enrolled_count
FROM public.course_batches b
WHERE b.status IN ('open', 'filling')
ORDER BY b.course_id, b.start_date NULLS LAST, b.created_at;

-- Course batches are already publicly viewable; mirror that on the view.
GRANT SELECT ON public.course_next_batch TO anon, authenticated;
-- ================================================================
-- 20260423131426_8957dbdd-7a9d-4de6-a00e-0626697d3779.sql
-- ================================================================
-- Update create_order_with_stock to:
--   1. Accept p_division as an explicit parameter (no more comma-split fragility)
--   2. Handle 'free_delivery' coupon type symmetrically with the client
-- Also add a new validate_coupon RPC that returns only safe fields (no usage metrics).

CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_user_id uuid,
  p_items jsonb,
  p_total_amount numeric,
  p_shipping_address text DEFAULT NULL::text,
  p_payment_method text DEFAULT 'cod'::text,
  p_coupon_id uuid DEFAULT NULL::uuid,
  p_division text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_current_stock int;
  v_unit_price numeric;
  v_subtotal numeric := 0;
  v_division text;
  v_delivery_charge numeric := 120; -- fallback
  v_discount numeric := 0;
  v_effective_delivery numeric;
  v_coupon record;
  v_verified_total numeric;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Lock products + recalc subtotal from server-side prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity for product %', v_product_id;
    END IF;

    SELECT stock, price INTO v_current_stock, v_unit_price
    FROM public.products
    WHERE id = v_product_id AND is_active = true
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product %', (v_item->>'name');
    END IF;

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  END LOOP;

  -- Resolve delivery charge: prefer explicit p_division, fall back to legacy
  -- comma-split for backward compatibility with older clients.
  v_division := COALESCE(NULLIF(trim(p_division), ''), trim(split_part(COALESCE(p_shipping_address, ''), ',', -1)));
  IF v_division <> '' THEN
    SELECT charge INTO v_delivery_charge
    FROM public.delivery_zones
    WHERE is_active = true AND lower(v_division) = ANY(SELECT lower(unnest(divisions)))
    LIMIT 1;
    IF v_delivery_charge IS NULL THEN
      v_delivery_charge := 120;
    END IF;
  END IF;

  v_effective_delivery := v_delivery_charge;

  -- Validate + apply coupon server-side
  IF p_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons
    WHERE id = p_coupon_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= now())
      AND (expires_at IS NULL OR expires_at > now())
      AND (usage_limit IS NULL OR used_count < usage_limit)
      AND (min_order_amount IS NULL OR v_subtotal >= min_order_amount);

    IF v_coupon.id IS NULL THEN
      RAISE EXCEPTION 'Invalid or expired coupon';
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_discount := round(v_subtotal * (v_coupon.discount_value / 100));
      IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
      END IF;
    ELSIF v_coupon.discount_type = 'free_delivery' THEN
      v_effective_delivery := 0;
      v_discount := 0;
    ELSE
      v_discount := v_coupon.discount_value;
    END IF;
    v_discount := LEAST(v_discount, v_subtotal);
  END IF;

  v_verified_total := v_subtotal + v_effective_delivery - v_discount;

  -- Reject if client-supplied total deviates by more than ৳1 (rounding tolerance)
  IF abs(v_verified_total - p_total_amount) > 1 THEN
    RAISE EXCEPTION 'Order total mismatch (expected %, got %)', v_verified_total, p_total_amount;
  END IF;

  INSERT INTO public.orders (user_id, items, total_amount, shipping_address, payment_method)
  VALUES (p_user_id, p_items, v_verified_total, p_shipping_address, p_payment_method)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);
    UPDATE public.products
    SET stock = GREATEST(stock - v_quantity, 0),
        badge = CASE WHEN stock - v_quantity <= 0 THEN 'Stock Out' ELSE badge END
    WHERE id = v_product_id;
  END LOOP;

  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
  END IF;

  RETURN v_order_id;
END;
$function$;

-- Safe coupon validation RPC: returns only customer-relevant fields.
-- Hides internal metrics (used_count, usage_limit, min_order_amount) from clients.
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal numeric)
RETURNS TABLE(
  id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  max_discount_amount numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon record;
BEGIN
  SELECT * INTO v_coupon
  FROM public.coupons c
  WHERE c.code = upper(trim(p_code))
    AND c.is_active = true
  LIMIT 1;

  IF v_coupon.id IS NULL THEN
    RAISE EXCEPTION 'INVALID_CODE';
  END IF;
  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
    RAISE EXCEPTION 'NOT_YET_ACTIVE';
  END IF;
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
    RAISE EXCEPTION 'EXPIRED';
  END IF;
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RAISE EXCEPTION 'LIMIT_REACHED';
  END IF;
  IF v_coupon.min_order_amount IS NOT NULL AND p_subtotal < v_coupon.min_order_amount THEN
    RAISE EXCEPTION 'MIN_ORDER_%', v_coupon.min_order_amount;
  END IF;

  RETURN QUERY SELECT
    v_coupon.id,
    v_coupon.code,
    v_coupon.discount_type,
    v_coupon.discount_value,
    v_coupon.max_discount_amount;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
-- ================================================================
-- 20260423135005_51008c0b-6bff-4753-939a-a430990835a5.sql
-- ================================================================
-- Create a lightweight log of broken routes hit by users so operators can
-- repair dead links surfaced from emails, partner sites, or stale bookmarks.
CREATE TABLE public.route_404_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  scope text NOT NULL DEFAULT 'public',
  user_id uuid,
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_404_log_created_at ON public.route_404_log (created_at DESC);
CREATE INDEX idx_route_404_log_path ON public.route_404_log (path);

ALTER TABLE public.route_404_log ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can record a 404 they encountered. Insert-only —
-- the body cannot read/update/delete to prevent abuse.
CREATE POLICY "Anyone can log a 404"
  ON public.route_404_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can review the log.
CREATE POLICY "Admins can read 404 log"
  ON public.route_404_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage 404 log"
  ON public.route_404_log
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

