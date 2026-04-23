export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      course_batches: {
        Row: {
          course_id: string
          created_at: string
          end_date: string | null
          enrolled_count: number | null
          id: string
          name: string
          start_date: string | null
          status: string
          total_seats: number | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          end_date?: string | null
          enrolled_count?: number | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          total_seats?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          end_date?: string | null
          enrolled_count?: number | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          total_seats?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          audience: string | null
          category: string | null
          created_at: string
          curriculum: Json | null
          description: string | null
          difficulty: string
          duration_label: string | null
          id: string
          instructor_id: string | null
          is_active: boolean
          language: string | null
          mode: string | null
          price: number
          provides_certificate: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          whatsapp_message: string | null
          whatsapp_number: string | null
        }
        Insert: {
          audience?: string | null
          category?: string | null
          created_at?: string
          curriculum?: Json | null
          description?: string | null
          difficulty?: string
          duration_label?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          language?: string | null
          mode?: string | null
          price?: number
          provides_certificate?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          audience?: string | null
          category?: string | null
          created_at?: string
          curriculum?: Json | null
          description?: string | null
          difficulty?: string
          duration_label?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          language?: string | null
          mode?: string | null
          price?: number
          provides_certificate?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          whatsapp_message?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          charge: number
          created_at: string | null
          delivery_fee: number
          divisions: string[]
          estimated_days: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          zone_name: string
        }
        Insert: {
          charge?: number
          created_at?: string | null
          delivery_fee?: number
          divisions?: string[]
          estimated_days?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          zone_name: string
        }
        Update: {
          charge?: number
          created_at?: string | null
          delivery_fee?: number
          divisions?: string[]
          estimated_days?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          zone_name?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          batch_id: string | null
          contact_phone: string | null
          course_id: string
          enrolled_at: string
          id: string
          notes: string | null
          progress: number
          status: string | null
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          contact_phone?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          notes?: string | null
          progress?: number
          status?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string | null
          contact_phone?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          notes?: string | null
          progress?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "course_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "course_next_batch"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      incomplete_orders: {
        Row: {
          cart_total: number | null
          completeness: number | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          division: string | null
          expires_at: string | null
          id: string
          items: Json | null
          recovered_order_id: string | null
          shipping_address: string | null
          status: string | null
          trashed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cart_total?: number | null
          completeness?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          division?: string | null
          expires_at?: string | null
          id?: string
          items?: Json | null
          recovered_order_id?: string | null
          shipping_address?: string | null
          status?: string | null
          trashed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cart_total?: number | null
          completeness?: number | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          division?: string | null
          expires_at?: string | null
          id?: string
          items?: Json | null
          recovered_order_id?: string | null
          shipping_address?: string | null
          status?: string | null
          trashed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          consignment_id: string | null
          created_at: string
          id: string
          items: Json
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          rejection_reason: string | null
          shipping_address: string | null
          status: string | null
          total_amount: number
          tracking_id: string | null
          trashed_at: string | null
          user_id: string
        }
        Insert: {
          consignment_id?: string | null
          created_at?: string
          id?: string
          items: Json
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          rejection_reason?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount: number
          tracking_id?: string | null
          trashed_at?: string | null
          user_id: string
        }
        Update: {
          consignment_id?: string | null
          created_at?: string
          id?: string
          items?: Json
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          rejection_reason?: string | null
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          tracking_id?: string | null
          trashed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          product_count: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          product_count?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          product_count?: number | null
          slug?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          badge: string | null
          category: string
          compare_price: number | null
          created_at: string
          description: string | null
          discount: number | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price: number
          product_type: string | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          badge?: string | null
          category: string
          compare_price?: number | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price: number
          product_type?: string | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          badge?: string | null
          category?: string
          compare_price?: number | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price?: number
          product_type?: string | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          cover_photo_url: string | null
          created_at: string
          district: string | null
          division: string | null
          full_name: string | null
          id: string
          phone: string | null
          thana: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          created_at?: string
          district?: string | null
          division?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          thana?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          cover_photo_url?: string | null
          created_at?: string
          district?: string | null
          division?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          thana?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_ratings"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      route_404_log: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          scope: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          scope?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          scope?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_ratings"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      course_next_batch: {
        Row: {
          batch_id: string | null
          course_id: string | null
          end_date: string | null
          enrolled_count: number | null
          name: string | null
          start_date: string | null
          status: string | null
          total_seats: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ratings: {
        Row: {
          avg_rating: number | null
          product_id: string | null
          review_count: number | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          cover_photo_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_incomplete_orders: { Args: never; Returns: number }
      create_order_with_stock:
        | {
            Args: {
              p_coupon_id?: string
              p_items: Json
              p_payment_method?: string
              p_shipping_address?: string
              p_total_amount: number
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_coupon_id?: string
              p_division?: string
              p_items: Json
              p_payment_method?: string
              p_shipping_address?: string
              p_total_amount: number
              p_user_id: string
            }
            Returns: string
          }
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_order_tracking_summary: {
        Args: { p_tracking_id: string }
        Returns: {
          consignment_id: string
          created_at: string
          id: string
          rejection_reason: string
          status: string
          tracking_id: string
        }[]
      }
      get_protected_admin_user_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: {
        Args: { p_coupon_id: string }
        Returns: undefined
      }
      validate_coupon: {
        Args: { p_code: string; p_subtotal: number }
        Returns: {
          code: string
          discount_type: string
          discount_value: number
          id: string
          max_discount_amount: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
