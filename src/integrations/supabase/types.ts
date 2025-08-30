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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attendance_events: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          class_id: string
          created_at: string
          date: string
          id: string
          late_minutes: number | null
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          class_id: string
          created_at?: string
          date: string
          id?: string
          late_minutes?: number | null
          notes?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          late_minutes?: number | null
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_max: number | null
          age_min: number | null
          capacity: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          age_max?: number | null
          age_min?: number | null
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          age_max?: number | null
          age_min?: number | null
          capacity?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      development_skills: {
        Row: {
          assessed_by: string
          assessment_date: string
          created_at: string
          id: string
          level: number
          notes: string | null
          skill_category: string | null
          skill_name: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assessed_by: string
          assessment_date?: string
          created_at?: string
          id?: string
          level: number
          notes?: string | null
          skill_category?: string | null
          skill_name: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assessed_by?: string
          assessment_date?: string
          created_at?: string
          id?: string
          level?: number
          notes?: string | null
          skill_category?: string | null
          skill_name?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "development_skills_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_skills_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "development_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissal_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          guardian_id: string
          id: string
          pickup_method: string | null
          pickup_time: string
          reason: string | null
          rejection_reason: string | null
          request_time: string
          status: Database["public"]["Enums"]["dismissal_status"]
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          guardian_id: string
          id?: string
          pickup_method?: string | null
          pickup_time: string
          reason?: string | null
          rejection_reason?: string | null
          request_time?: string
          status?: Database["public"]["Enums"]["dismissal_status"]
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          guardian_id?: string
          id?: string
          pickup_method?: string | null
          pickup_time?: string
          reason?: string | null
          rejection_reason?: string | null
          request_time?: string
          status?: Database["public"]["Enums"]["dismissal_status"]
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissal_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissal_requests_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissal_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissal_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissal_tokens: {
        Row: {
          created_at: string
          dismissal_request_id: string
          expires_at: string
          id: string
          is_active: boolean
          tenant_id: string
          token_type: string
          token_value: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          dismissal_request_id: string
          expires_at: string
          id?: string
          is_active?: boolean
          tenant_id: string
          token_type: string
          token_value: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          dismissal_request_id?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          token_type?: string
          token_value?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dismissal_tokens_dismissal_request_id_fkey"
            columns: ["dismissal_request_id"]
            isOneToOne: false
            referencedRelation: "dismissal_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissal_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dismissal_tokens_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_student_links: {
        Row: {
          can_pickup: boolean
          created_at: string
          guardian_id: string
          id: string
          is_primary: boolean
          relationship: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          can_pickup?: boolean
          created_at?: string
          guardian_id: string
          id?: string
          is_primary?: boolean
          relationship: string
          student_id: string
          tenant_id: string
        }
        Update: {
          can_pickup?: boolean
          created_at?: string
          guardian_id?: string
          id?: string
          is_primary?: boolean
          relationship?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_student_links_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_student_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          can_pickup: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          phone: string
          relationship: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          can_pickup?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          phone: string
          relationship?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          can_pickup?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          phone?: string
          relationship?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_checks: {
        Row: {
          allergies: Json | null
          check_date: string
          checked_by: string
          created_at: string
          height: number | null
          id: string
          medications: Json | null
          notes: string | null
          parent_notified: boolean
          special_needs: string | null
          student_id: string
          temperature: number | null
          tenant_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          allergies?: Json | null
          check_date?: string
          checked_by: string
          created_at?: string
          height?: number | null
          id?: string
          medications?: Json | null
          notes?: string | null
          parent_notified?: boolean
          special_needs?: string | null
          student_id: string
          temperature?: number | null
          tenant_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          allergies?: Json | null
          check_date?: string
          checked_by?: string
          created_at?: string
          height?: number | null
          id?: string
          medications?: Json | null
          notes?: string | null
          parent_notified?: boolean
          special_needs?: string | null
          student_id?: string
          temperature?: number | null
          tenant_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_checks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_checks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          album_date: string
          caption: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          is_public: boolean
          mime_type: string | null
          tags: Json | null
          tenant_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          album_date?: string
          caption?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          tags?: Json | null
          tenant_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          album_date?: string
          caption?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          tags?: Json | null
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_student_links: {
        Row: {
          created_at: string
          id: string
          media_id: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_id: string
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          media_id?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_student_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_student_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          file_path: string | null
          filters: Json | null
          generated_by: string
          generated_for: string | null
          id: string
          is_shared: boolean
          report_data: Json
          report_type: string
          shared_until: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          filters?: Json | null
          generated_by: string
          generated_for?: string | null
          id?: string
          is_shared?: boolean
          report_data: Json
          report_type: string
          shared_until?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          filters?: Json | null
          generated_by?: string
          generated_for?: string | null
          id?: string
          is_shared?: boolean
          report_data?: Json
          report_type?: string
          shared_until?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_generated_for_fkey"
            columns: ["generated_for"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          awarded_at: string
          awarded_by: string
          badge_color: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_public: boolean
          notes: string | null
          points: number
          student_id: string
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["reward_type"]
        }
        Insert: {
          awarded_at?: string
          awarded_by: string
          badge_color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_public?: boolean
          notes?: string | null
          points?: number
          student_id: string
          tenant_id: string
          title: string
          type: Database["public"]["Enums"]["reward_type"]
        }
        Update: {
          awarded_at?: string
          awarded_by?: string
          badge_color?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_public?: boolean
          notes?: string | null
          points?: number
          student_id?: string
          tenant_id?: string
          title?: string
          type?: Database["public"]["Enums"]["reward_type"]
        }
        Relationships: [
          {
            foreignKeyName: "rewards_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string
          date_of_birth: string
          emergency_contact: Json | null
          enrollment_date: string
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          medical_info: Json | null
          photo_url: string | null
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date_of_birth: string
          emergency_contact?: Json | null
          enrollment_date?: string
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          medical_info?: Json | null
          photo_url?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date_of_birth?: string
          emergency_contact?: Json | null
          enrollment_date?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          medical_info?: Json | null
          photo_url?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          tenant_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          tenant_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          domain: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          domain?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          domain?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          from_number: string
          guardian_id: string | null
          id: string
          media_url: string | null
          message_id: string | null
          message_text: string | null
          message_type: string | null
          processed: boolean
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          student_id: string | null
          template_name: string | null
          tenant_id: string
          to_number: string
          updated_at: string
          webhook_data: Json | null
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          delivered_at?: string | null
          direction: string
          error_message?: string | null
          from_number: string
          guardian_id?: string | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          processed?: boolean
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          student_id?: string | null
          template_name?: string | null
          tenant_id: string
          to_number: string
          updated_at?: string
          webhook_data?: Json | null
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          from_number?: string
          guardian_id?: string | null
          id?: string
          media_url?: string | null
          message_id?: string | null
          message_text?: string | null
          message_type?: string | null
          processed?: boolean
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          student_id?: string | null
          template_name?: string | null
          tenant_id?: string
          to_number?: string
          updated_at?: string
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "wa_messages_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wa_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      dismissal_status: "pending" | "approved" | "rejected" | "completed"
      message_status: "pending" | "sent" | "delivered" | "failed"
      reward_type: "star" | "badge" | "certificate" | "achievement"
      subscription_status: "active" | "past_due" | "cancelled" | "suspended"
      tenant_status: "pending" | "approved" | "suspended" | "cancelled"
      user_role:
        | "super_admin"
        | "owner"
        | "admin"
        | "teacher"
        | "gate"
        | "guardian"
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
      attendance_status: ["present", "absent", "late", "excused"],
      dismissal_status: ["pending", "approved", "rejected", "completed"],
      message_status: ["pending", "sent", "delivered", "failed"],
      reward_type: ["star", "badge", "certificate", "achievement"],
      subscription_status: ["active", "past_due", "cancelled", "suspended"],
      tenant_status: ["pending", "approved", "suspended", "cancelled"],
      user_role: [
        "super_admin",
        "owner",
        "admin",
        "teacher",
        "gate",
        "guardian",
      ],
    },
  },
} as const
