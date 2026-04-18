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
