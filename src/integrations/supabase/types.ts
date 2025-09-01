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
      assignment_evaluations: {
        Row: {
          assignment_id: string
          completion_date: string | null
          created_at: string
          evaluated_at: string
          evaluated_by: string
          evaluation_score: number | null
          evaluation_status: string
          id: string
          student_id: string
          teacher_feedback: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          completion_date?: string | null
          created_at?: string
          evaluated_at?: string
          evaluated_by: string
          evaluation_score?: number | null
          evaluation_status: string
          id?: string
          student_id: string
          teacher_feedback?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          completion_date?: string | null
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string
          evaluation_score?: number | null
          evaluation_status?: string
          id?: string
          student_id?: string
          teacher_feedback?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          feedback: string | null
          file_urls: Json | null
          grade: number | null
          id: string
          status: string | null
          student_id: string
          submission_content: string | null
          submitted_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          feedback?: string | null
          file_urls?: Json | null
          grade?: number | null
          id?: string
          status?: string | null
          student_id: string
          submission_content?: string | null
          submitted_at?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          feedback?: string | null
          file_urls?: Json | null
          grade?: number | null
          id?: string
          status?: string | null
          student_id?: string
          submission_content?: string | null
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignment_type: string
          class_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_group_assignment: boolean | null
          priority: string | null
          status: string
          student_id: string | null
          subject: string | null
          teacher_id: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assignment_type?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_group_assignment?: boolean | null
          priority?: string | null
          status?: string
          student_id?: string | null
          subject?: string | null
          teacher_id: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_group_assignment?: boolean | null
          priority?: string | null
          status?: string
          student_id?: string | null
          subject?: string | null
          teacher_id?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      cms_blocks: {
        Row: {
          block_type: Database["public"]["Enums"]["block_type"]
          content: Json
          created_at: string
          id: string
          is_visible: boolean
          page_id: string
          settings: Json | null
          sort_order: number
          title: string | null
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["block_type"]
          content: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id: string
          settings?: Json | null
          sort_order?: number
          title?: string | null
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["block_type"]
          content?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          page_id?: string
          settings?: Json | null
          sort_order?: number
          title?: string | null
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          created_at: string
          custom_css: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_keywords: string | null
          meta_title: string | null
          og_image: string | null
          slug: string
          sort_order: number | null
          template_name: string | null
          title: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_css?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_image?: string | null
          slug: string
          sort_order?: number | null
          template_name?: string | null
          title: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_css?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_keywords?: string | null
          meta_title?: string | null
          og_image?: string | null
          slug?: string
          sort_order?: number | null
          template_name?: string | null
          title?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
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
      faqs: {
        Row: {
          answer: string
          answer_ar: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
          question: string
          question_ar: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          answer_ar: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          question_ar: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          answer_ar?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          question_ar?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          reference_number: string | null
          status: string
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          reference_number?: string | null
          status?: string
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          reference_number?: string | null
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
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
      invoice_items: {
        Row: {
          created_at: string
          description: string
          description_ar: string | null
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          description_ar?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          description_ar?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string
          currency: string
          discount_amount: number | null
          due_date: string
          file_path: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          tenant_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          currency?: string
          discount_amount?: number | null
          due_date: string
          file_path?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
          subtotal: number
          tax_amount?: number
          tax_rate?: number | null
          tenant_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          currency?: string
          discount_amount?: number | null
          due_date?: string
          file_path?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          tenant_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
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
      notification_reminders: {
        Row: {
          assignment_id: string | null
          created_at: string
          id: string
          message_content: string | null
          reminder_type: string
          scheduled_date: string
          sent_at: string | null
          status: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          message_content?: string | null
          reminder_type: string
          scheduled_date: string
          sent_at?: string | null
          status?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          message_content?: string | null
          reminder_type?: string
          scheduled_date?: string
          sent_at?: string | null
          status?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failed_reason: string | null
          id: string
          invoice_id: string
          metadata: Json | null
          notes: string | null
          payment_method: string
          payment_provider: string | null
          processed_at: string | null
          processed_by: string | null
          provider_transaction_id: string | null
          receipt_url: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failed_reason?: string | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          notes?: string | null
          payment_method: string
          payment_provider?: string | null
          processed_at?: string | null
          processed_by?: string | null
          provider_transaction_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failed_reason?: string | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          notes?: string | null
          payment_method?: string
          payment_provider?: string | null
          processed_at?: string | null
          processed_by?: string | null
          provider_transaction_id?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_responses: {
        Row: {
          created_at: string | null
          guardian_id: string
          id: string
          notes: string | null
          otp_expires_at: string | null
          otp_token: string | null
          permission_id: string
          responded_at: string | null
          response: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          guardian_id: string
          id?: string
          notes?: string | null
          otp_expires_at?: string | null
          otp_token?: string | null
          permission_id: string
          responded_at?: string | null
          response: string
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          guardian_id?: string
          id?: string
          notes?: string | null
          otp_expires_at?: string | null
          otp_token?: string | null
          permission_id?: string
          responded_at?: string | null
          response?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_responses_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_responses_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_responses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          permission_type: string | null
          response_options: Json | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          permission_type?: string | null
          response_options?: Json | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          permission_type?: string | null
          response_options?: Json | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          features: Json
          has_analytics: boolean
          has_reports: boolean
          has_whatsapp: boolean
          id: string
          is_active: boolean
          is_popular: boolean
          max_classes: number | null
          max_students: number | null
          max_teachers: number | null
          name: string
          name_ar: string
          price_monthly: number
          price_quarterly: number | null
          price_yearly: number | null
          sort_order: number | null
          storage_gb: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          features: Json
          has_analytics?: boolean
          has_reports?: boolean
          has_whatsapp?: boolean
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_classes?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          name_ar: string
          price_monthly: number
          price_quarterly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          storage_gb?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          features?: Json
          has_analytics?: boolean
          has_reports?: boolean
          has_whatsapp?: boolean
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_classes?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          name_ar?: string
          price_monthly?: number
          price_quarterly?: number | null
          price_yearly?: number | null
          sort_order?: number | null
          storage_gb?: number | null
          updated_at?: string
        }
        Relationships: []
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
      site_settings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      student_fees: {
        Row: {
          amount: number
          created_at: string
          discount: number | null
          due_date: string
          fee_type: string
          id: string
          notes: string | null
          payment_date: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          discount?: number | null
          due_date: string
          fee_type?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          discount?: number | null
          due_date?: string
          fee_type?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_notes: {
        Row: {
          ai_analysis: string | null
          ai_suggestions: string | null
          content: string
          created_at: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          guardian_notified: boolean | null
          id: string
          is_private: boolean | null
          note_type: string
          notified_at: string | null
          severity: string | null
          student_id: string
          teacher_id: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_suggestions?: string | null
          content: string
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          guardian_notified?: boolean | null
          id?: string
          is_private?: boolean | null
          note_type: string
          notified_at?: string | null
          severity?: string | null
          student_id: string
          teacher_id: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_suggestions?: string | null
          content?: string
          created_at?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          guardian_notified?: boolean | null
          id?: string
          is_private?: boolean | null
          note_type?: string
          notified_at?: string | null
          severity?: string | null
          student_id?: string
          teacher_id?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      subscription_history: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          new_plan_id: string | null
          new_status: Database["public"]["Enums"]["subscription_status"] | null
          notes: string | null
          old_plan_id: string | null
          old_status: Database["public"]["Enums"]["subscription_status"] | null
          reason: string | null
          subscription_id: string
          tenant_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_plan_id?: string | null
          new_status?: Database["public"]["Enums"]["subscription_status"] | null
          notes?: string | null
          old_plan_id?: string | null
          old_status?: Database["public"]["Enums"]["subscription_status"] | null
          reason?: string | null
          subscription_id: string
          tenant_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_plan_id?: string | null
          new_status?: Database["public"]["Enums"]["subscription_status"] | null
          notes?: string | null
          old_plan_id?: string | null
          old_status?: Database["public"]["Enums"]["subscription_status"] | null
          reason?: string | null
          subscription_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_new_plan_id_fkey"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_old_plan_id_fkey"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string
          current_period_start: string
          failed_payments_count: number | null
          grace_period_end: string | null
          id: string
          metadata: Json | null
          next_billing_date: string | null
          payment_method: string | null
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end: string
          current_period_start: string
          failed_payments_count?: number | null
          grace_period_end?: string | null
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string
          current_period_start?: string
          failed_payments_count?: number | null
          grace_period_end?: string | null
          id?: string
          metadata?: Json | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          question_text: string
          question_type: string
          sort_order: number | null
          survey_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text: string
          question_type: string
          sort_order?: number | null
          survey_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          question_text?: string
          question_type?: string
          sort_order?: number | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: string
          otp_expires_at: string | null
          otp_token: string | null
          question_id: string
          respondent_id: string | null
          respondent_type: string | null
          response_options: string[] | null
          response_text: string | null
          survey_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          otp_expires_at?: string | null
          otp_token?: string | null
          question_id: string
          respondent_id?: string | null
          respondent_type?: string | null
          response_options?: string[] | null
          response_text?: string | null
          survey_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          otp_expires_at?: string | null
          otp_token?: string | null
          question_id?: string
          respondent_id?: string | null
          respondent_type?: string | null
          response_options?: string[] | null
          response_text?: string | null
          survey_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          is_anonymous: boolean | null
          survey_type: string | null
          target_audience: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          survey_type?: string | null
          target_audience?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          is_anonymous?: boolean | null
          survey_type?: string | null
          target_audience?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_tenant_id_fkey"
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
      tenant_subscriptions: {
        Row: {
          created_at: string
          currency: string | null
          end_date: string
          features: Json | null
          id: string
          plan_type: string
          price: number | null
          start_date: string
          status: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          end_date: string
          features?: Json | null
          id?: string
          plan_type: string
          price?: number | null
          start_date: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          end_date?: string
          features?: Json | null
          id?: string
          plan_type?: string
          price?: number | null
          start_date?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
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
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          owner_phone: string | null
          password_reset_required: boolean | null
          phone: string | null
          plan_type: string | null
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          temp_password: string | null
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
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          plan_type?: string | null
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          temp_password?: string | null
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
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          password_reset_required?: boolean | null
          phone?: string | null
          plan_type?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          temp_password?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string
          customer_name: string
          customer_title: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          nursery_name: string | null
          rating: number | null
          sort_order: number | null
          testimonial_text: string
          testimonial_text_ar: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          customer_name: string
          customer_title?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          nursery_name?: string | null
          rating?: number | null
          sort_order?: number | null
          testimonial_text: string
          testimonial_text_ar?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          customer_name?: string
          customer_title?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          nursery_name?: string | null
          rating?: number | null
          sort_order?: number | null
          testimonial_text?: string
          testimonial_text_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      themes: {
        Row: {
          config: Json
          created_at: string
          css_variables: Json | null
          description: string | null
          description_ar: string | null
          display_name: string
          display_name_ar: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          preview_image: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          config: Json
          created_at?: string
          css_variables?: Json | null
          description?: string | null
          description_ar?: string | null
          display_name: string
          display_name_ar: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          preview_image?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          css_variables?: Json | null
          description?: string | null
          description_ar?: string | null
          display_name?: string
          display_name_ar?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          preview_image?: string | null
          updated_at?: string
          version?: string | null
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
      virtual_class_attendance: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          joined_at: string | null
          left_at: string | null
          status: string | null
          student_id: string
          tenant_id: string
          updated_at: string | null
          virtual_class_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string | null
          virtual_class_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          status?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string | null
          virtual_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_class_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_class_attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_class_attendance_virtual_class_id_fkey"
            columns: ["virtual_class_id"]
            isOneToOne: false
            referencedRelation: "virtual_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_classes: {
        Row: {
          class_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          meeting_id: string | null
          meeting_url: string
          passcode: string | null
          provider: string
          scheduled_at: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          meeting_id?: string | null
          meeting_url: string
          passcode?: string | null
          provider: string
          scheduled_at: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          meeting_id?: string | null
          meeting_url?: string
          passcode?: string | null
          provider?: string
          scheduled_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_classes_tenant_id_fkey"
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
      whatsapp_messages: {
        Row: {
          created_at: string
          id: string
          message_content: string
          message_type: string
          recipient_phone: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          message_type: string
          recipient_phone: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          message_type?: string
          recipient_phone?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
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
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      process_scheduled_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_expiry_warnings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_overdue_fees: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      billing_interval: "monthly" | "quarterly" | "yearly"
      block_type:
        | "hero"
        | "features"
        | "testimonials"
        | "pricing"
        | "faq"
        | "cta"
        | "gallery"
        | "stats"
        | "about"
        | "contact"
      content_status: "draft" | "published" | "archived"
      dismissal_status: "pending" | "approved" | "rejected" | "completed"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      message_status: "pending" | "sent" | "delivered" | "failed"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
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
      billing_interval: ["monthly", "quarterly", "yearly"],
      block_type: [
        "hero",
        "features",
        "testimonials",
        "pricing",
        "faq",
        "cta",
        "gallery",
        "stats",
        "about",
        "contact",
      ],
      content_status: ["draft", "published", "archived"],
      dismissal_status: ["pending", "approved", "rejected", "completed"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      message_status: ["pending", "sent", "delivered", "failed"],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
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
