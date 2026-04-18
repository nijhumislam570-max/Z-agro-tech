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