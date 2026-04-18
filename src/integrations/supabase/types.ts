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
      appointment_waitlist: {
        Row: {
          clinic_id: string
          created_at: string
          doctor_id: string | null
          expires_at: string | null
          id: string
          notification_sent_at: string | null
          pet_name: string
          pet_type: string
          position: number | null
          preferred_date: string
          preferred_time: string
          reason: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          expires_at?: string | null
          id?: string
          notification_sent_at?: string | null
          pet_name: string
          pet_type: string
          position?: number | null
          preferred_date: string
          preferred_time: string
          reason?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          expires_at?: string | null
          id?: string
          notification_sent_at?: string | null
          pet_name?: string
          pet_type?: string
          position?: number | null
          preferred_date?: string
          preferred_time?: string
          reason?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_waitlist_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_waitlist_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_waitlist_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_waitlist_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at: string
          doctor_id: string | null
          id: string
          pet_name: string | null
          pet_type: string | null
          reason: string | null
          reminder_sent_at: string | null
          reminder_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          clinic_id: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          pet_name?: string | null
          pet_type?: string | null
          reason?: string | null
          reminder_sent_at?: string | null
          reminder_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          clinic_id?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          pet_name?: string | null
          pet_type?: string | null
          reason?: string | null
          reminder_sent_at?: string | null
          reminder_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_doctors: {
        Row: {
          clinic_id: string
          doctor_id: string
          id: string
          joined_at: string
          status: string | null
        }
        Insert: {
          clinic_id: string
          doctor_id: string
          id?: string
          joined_at?: string
          status?: string | null
        }
        Update: {
          clinic_id?: string
          doctor_id?: string
          id?: string
          joined_at?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_favorites: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_favorites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_favorites_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_reviews: {
        Row: {
          clinic_id: string
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_reviews_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_services: {
        Row: {
          clinic_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          clinic_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          clinic_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          blocked_at: string | null
          blocked_reason: string | null
          bvc_certificate_url: string | null
          cover_photo_url: string | null
          created_at: string
          description: string | null
          distance: string | null
          email: string | null
          id: string
          image_url: string | null
          is_blocked: boolean | null
          is_open: boolean | null
          is_verified: boolean | null
          name: string
          opening_hours: string | null
          owner_name: string | null
          owner_nid: string | null
          owner_user_id: string | null
          phone: string | null
          rating: number | null
          rejection_reason: string | null
          services: string[] | null
          trade_license_url: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
        }
        Insert: {
          address?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          bvc_certificate_url?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          distance?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_blocked?: boolean | null
          is_open?: boolean | null
          is_verified?: boolean | null
          name: string
          opening_hours?: string | null
          owner_name?: string | null
          owner_nid?: string | null
          owner_user_id?: string | null
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          services?: string[] | null
          trade_license_url?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Update: {
          address?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          bvc_certificate_url?: string | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          distance?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_blocked?: boolean | null
          is_open?: boolean | null
          is_verified?: boolean | null
          name?: string
          opening_hours?: string | null
          owner_name?: string | null
          owner_nid?: string | null
          owner_user_id?: string | null
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          services?: string[] | null
          trade_license_url?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Relationships: []
      }
      cms_articles: {
        Row: {
          author_id: string
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          pet_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
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
      courses: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          id: string
          instructor_id: string | null
          is_active: boolean
          price: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          price?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          price?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
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
      doctor_favorites: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_favorites_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_favorites_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_join_requests: {
        Row: {
          clinic_id: string
          created_at: string | null
          doctor_id: string
          id: string
          message: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          clinic_id: string
          created_at?: string | null
          doctor_id: string
          id?: string
          message?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          clinic_id?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          message?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_join_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_join_requests_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_join_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_join_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_schedules: {
        Row: {
          clinic_id: string
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_available: boolean | null
          max_appointments: number | null
          slot_duration_minutes: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          max_appointments?: number | null
          slot_duration_minutes?: number | null
          start_time: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          max_appointments?: number | null
          slot_duration_minutes?: number | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          blocked_reason: string | null
          bvc_certificate_url: string | null
          consultation_fee: number | null
          created_at: string
          created_by_clinic_id: string | null
          email: string | null
          experience_years: number | null
          id: string
          is_available: boolean | null
          is_blocked: boolean | null
          is_verified: boolean | null
          license_number: string | null
          name: string
          nid_number: string | null
          phone: string | null
          qualifications: string[] | null
          rejection_reason: string | null
          specialization: string | null
          updated_at: string
          user_id: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          bvc_certificate_url?: string | null
          consultation_fee?: number | null
          created_at?: string
          created_by_clinic_id?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          name: string
          nid_number?: string | null
          phone?: string | null
          qualifications?: string[] | null
          rejection_reason?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          bvc_certificate_url?: string | null
          consultation_fee?: number | null
          created_at?: string
          created_by_clinic_id?: string | null
          email?: string | null
          experience_years?: number | null
          id?: string
          is_available?: boolean | null
          is_blocked?: boolean | null
          is_verified?: boolean | null
          license_number?: string | null
          name?: string
          nid_number?: string | null
          phone?: string | null
          qualifications?: string[] | null
          rejection_reason?: string | null
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_pet_id: string | null
          follower_user_id: string
          following_pet_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_pet_id?: string | null
          follower_user_id: string
          following_pet_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_pet_id?: string | null
          follower_user_id?: string
          following_pet_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_pet_id_fkey"
            columns: ["follower_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_pet_id_fkey"
            columns: ["following_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          pet_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          media_type: string | null
          media_url: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          media_type?: string | null
          media_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_pet_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string | null
          target_appointment_id: string | null
          target_clinic_id: string | null
          target_order_id: string | null
          target_pet_id: string | null
          target_post_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_pet_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_appointment_id?: string | null
          target_clinic_id?: string | null
          target_order_id?: string | null
          target_pet_id?: string | null
          target_post_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_pet_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string | null
          target_appointment_id?: string | null
          target_clinic_id?: string | null
          target_order_id?: string | null
          target_pet_id?: string | null
          target_post_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_pet_id_fkey"
            columns: ["actor_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_clinic_id_fkey"
            columns: ["target_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_clinic_id_fkey"
            columns: ["target_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_pet_id_fkey"
            columns: ["target_pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_post_id_fkey"
            columns: ["target_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
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
      pets: {
        Row: {
          age: string | null
          avatar_url: string | null
          bio: string | null
          breed: string | null
          cover_photo_url: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          species: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          breed?: string | null
          cover_photo_url?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          species: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          bio?: string | null
          breed?: string | null
          cover_photo_url?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          species?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string
          id: string
          likes_count: number | null
          media_type: string | null
          media_urls: string[] | null
          pet_id: string
          shares_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_urls?: string[] | null
          pet_id: string
          shares_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_type?: string | null
          media_urls?: string[] | null
          pet_id?: string
          shares_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          pet_id: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          pet_id: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          pet_id?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_user_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_user_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clinics_public: {
        Row: {
          address: string | null
          cover_photo_url: string | null
          created_at: string | null
          description: string | null
          distance: string | null
          email: string | null
          id: string | null
          image_url: string | null
          is_open: boolean | null
          is_verified: boolean | null
          name: string | null
          opening_hours: string | null
          phone: string | null
          rating: number | null
          services: string[] | null
        }
        Insert: {
          address?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          distance?: string | null
          email?: string | null
          id?: string | null
          image_url?: string | null
          is_open?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          opening_hours?: string | null
          phone?: string | null
          rating?: number | null
          services?: string[] | null
        }
        Update: {
          address?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          description?: string | null
          distance?: string | null
          email?: string | null
          id?: string | null
          image_url?: string | null
          is_open?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          opening_hours?: string | null
          phone?: string | null
          rating?: number | null
          services?: string[] | null
        }
        Relationships: []
      }
      doctors_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consultation_fee: number | null
          created_at: string | null
          created_by_clinic_id: string | null
          experience_years: number | null
          id: string | null
          is_available: boolean | null
          is_verified: boolean | null
          name: string | null
          qualifications: string[] | null
          specialization: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          created_by_clinic_id?: string | null
          experience_years?: number | null
          id?: string | null
          is_available?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          qualifications?: string[] | null
          specialization?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          created_by_clinic_id?: string | null
          experience_years?: number | null
          id?: string | null
          is_available?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          qualifications?: string[] | null
          specialization?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_created_by_clinic_id_fkey"
            columns: ["created_by_clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics_public"
            referencedColumns: ["id"]
          },
        ]
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
      book_appointment_atomic: {
        Args: {
          p_appointment_date?: string
          p_appointment_time?: string
          p_clinic_id: string
          p_doctor_id?: string
          p_pet_name?: string
          p_pet_type?: string
          p_reason?: string
          p_user_id: string
        }
        Returns: string
      }
      create_order_with_stock: {
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
      decrement_stock: {
        Args: { p_product_id: string; p_quantity: number }
        Returns: undefined
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_doctor_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
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
      is_clinic_owner: {
        Args: { _clinic_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "doctor" | "clinic_owner"
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
      app_role: ["admin", "moderator", "user", "doctor", "clinic_owner"],
    },
  },
} as const
