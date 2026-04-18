export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  product_type: string | null;
  image_url: string | null;
  images: string[] | null;
  badge: string | null;
  discount: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  compare_price: number | null;
  sku: string | null;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  rating: number;
  distance: string | null;
  services: string[] | null;
  image_url: string | null;
  cover_photo_url: string | null;
  is_open: boolean;
  opening_hours: string | null;
  is_verified: boolean;
  verification_status: string | null;
  owner_user_id: string | null;
  created_at: string;
  // Verification details
  owner_name: string | null;
  owner_nid: string | null;
  bvc_certificate_url: string | null;
  trade_license_url: string | null;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
  rejection_reason: string | null;
  is_blocked: boolean | null;
  blocked_at: string | null;
  blocked_reason: string | null;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  division: string | null;
  district: string | null;
  thana: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  pet_name: string | null;
  pet_type: string | null;
  reason: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  clinic?: Clinic;
}

export interface Order {
  id: string;
  user_id: string;
  items: any;
  total_amount: number;
  shipping_address: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// ── Joined / enriched types for admin and complex queries ──

/** Order row as returned by useAdminOrders (explicit select + joined profile) */
export interface AdminOrder {
  id: string;
  user_id: string;
  items: unknown;
  total_amount: number;
  status: string | null;
  shipping_address: string | null;
  created_at: string;
  tracking_id: string | null;
  payment_method: string | null;
  payment_status: string | null;
  trashed_at: string | null;
  consignment_id: string | null;
  rejection_reason: string | null;
  profile: OrderProfile | null;
}

export interface OrderProfile {
  full_name: string | null;
  phone: string | null;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/** Raw conversation row (matches the DB select, no Supabase generic cast needed) */
export interface ConversationRow {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string | null;
  created_at: string;
}

/** Favorite clinic as returned by join query */
export interface FavoriteClinicRow {
  id: string;
  clinic_id: string;
  clinic: {
    id: string;
    name: string;
    rating: number | null;
    distance: string | null;
    services: string[] | null;
    image_url: string | null;
    is_open: boolean | null;
    is_verified: boolean | null;
  };
}

/** Favorite doctor as returned by join query */
export interface FavoriteDoctorRow {
  id: string;
  doctor_id: string;
  doctor: {
    id: string;
    name: string;
    specialization: string | null;
    qualifications: string[] | null;
    experience_years: number | null;
    consultation_fee: number | null;
    is_available: boolean | null;
    is_verified: boolean | null;
    avatar_url: string | null;
  };
}

/** CMS article insert/update payload (matches cms_articles table without id/timestamps) */
export interface CMSArticlePayload {
  title: string;
  slug: string;
  content?: string | null;
  excerpt?: string | null;
  featured_image?: string | null;
  status?: string;
  author_id: string;
  category: string;
  tags?: string[];
  published_at?: string | null;
}
