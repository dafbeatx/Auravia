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
      events: {
        Row: {
          address: string | null
          created_at: string
          end_time: string | null
          id: string
          invitation_id: string
          is_primary: boolean
          maps_url: string | null
          start_time: string
          timezone: string
          title: string
          venue_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          invitation_id: string
          is_primary?: boolean
          maps_url?: string | null
          start_time: string
          timezone?: string
          title: string
          venue_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          invitation_id?: string
          is_primary?: boolean
          maps_url?: string | null
          start_time?: string
          timezone?: string
          title?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_items: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          height: number | null
          id: string
          invitation_id: string
          storage_path: string
          thumbnail_path: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          height?: number | null
          id?: string
          invitation_id: string
          storage_path: string
          thumbnail_path: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          height?: number | null
          id?: string
          invitation_id?: string
          storage_path?: string
          thumbnail_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          id: string
          invitation_id: string
          name: string
          pax_limit: number
          phone: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_id: string
          name: string
          pax_limit?: number
          phone?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_id?: string
          name?: string
          pax_limit?: number
          phone?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_data: {
        Row: {
          content: Json
          id: string
          invitation_id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id?: string
          invitation_id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          invitation_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_data_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: true
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_sections: {
        Row: {
          created_at: string
          custom_config: Json
          display_order: number
          id: string
          invitation_id: string
          is_enabled: boolean
          section_type: string
          variant: string
        }
        Insert: {
          created_at?: string
          custom_config?: Json
          display_order?: number
          id?: string
          invitation_id: string
          is_enabled?: boolean
          section_type: string
          variant?: string
        }
        Update: {
          created_at?: string
          custom_config?: Json
          display_order?: number
          id?: string
          invitation_id?: string
          is_enabled?: boolean
          section_type?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_sections_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          allow_rsvp: boolean
          created_at: string
          event_type: string
          id: string
          published_at: string | null
          settings: Json
          show_wishes: boolean
          slug: string
          status: string
          template_id: string
          theme_override: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_rsvp?: boolean
          created_at?: string
          event_type?: string
          id?: string
          published_at?: string | null
          settings?: Json
          show_wishes?: boolean
          slug: string
          status?: string
          template_id: string
          theme_override?: Json
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_rsvp?: boolean
          created_at?: string
          event_type?: string
          id?: string
          published_at?: string | null
          settings?: Json
          show_wishes?: boolean
          slug?: string
          status?: string
          template_id?: string
          theme_override?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          anonymous_id: string | null
          browser: string | null
          created_at: string
          device_type: 'desktop' | 'tablet' | 'mobile' | 'unknown'
          event_name: string
          id: string
          invitation_id: string | null
          metadata: Json | null
          path: string
          referrer: string | null
          session_id: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          browser?: string | null
          created_at?: string
          device_type?: 'desktop' | 'tablet' | 'mobile' | 'unknown'
          event_name: string
          id?: string
          invitation_id?: string | null
          metadata?: Json | null
          path: string
          referrer?: string | null
          session_id: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          browser?: string | null
          created_at?: string
          device_type?: 'desktop' | 'tablet' | 'mobile' | 'unknown'
          event_name?: string
          id?: string
          invitation_id?: string | null
          metadata?: Json | null
          path?: string
          referrer?: string | null
          session_id?: string
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: 'user' | 'admin'
          status: 'active' | 'inactive' | 'suspended'
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: 'user' | 'admin'
          status?: 'active' | 'inactive' | 'suspended'
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: 'user' | 'admin'
          status?: 'active' | 'inactive' | 'suspended'
          updated_at?: string
        }
        Relationships: []
      }
      rsvps: {
        Row: {
          created_at: string
          guest_id: string | null
          guest_name: string
          id: string
          invitation_id: string
          is_hidden: boolean
          pax_count: number
          status: string
          wishes: string | null
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          guest_name: string
          id?: string
          invitation_id: string
          is_hidden?: boolean
          pax_count?: number
          status: string
          wishes?: string | null
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          guest_name?: string
          id?: string
          invitation_id?: string
          is_hidden?: boolean
          pax_count?: number
          status?: string
          wishes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_rsvps_composite_guest"
            columns: ["guest_id", "invitation_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id", "invitation_id"]
          },
          {
            foreignKeyName: "rsvps_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string
          created_at: string
          default_sections: Json
          default_theme: Json
          description: string
          display_order: number
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          preview_desktop_path: string | null
          preview_mobile_path: string | null
          preview_thumbnail_path: string | null
          slug: string
          status: 'draft' | 'active' | 'archived'
          thumbnail_url: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          default_sections?: Json
          default_theme?: Json
          description: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          preview_desktop_path?: string | null
          preview_mobile_path?: string | null
          preview_thumbnail_path?: string | null
          slug: string
          status?: 'draft' | 'active' | 'archived'
          thumbnail_url: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_sections?: Json
          default_theme?: Json
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          preview_desktop_path?: string | null
          preview_mobile_path?: string | null
          preview_thumbnail_path?: string | null
          slug?: string
          status?: 'draft' | 'active' | 'archived'
          thumbnail_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_identities: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          display_name: string | null
          failed_attempts: number
          id: string
          is_active: boolean
          last_login_at: string | null
          locked_until: string | null
          password_hash: string
          role: 'super_admin' | 'admin'
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          failed_attempts?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          password_hash: string
          role?: 'super_admin' | 'admin'
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          failed_attempts?: number
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          password_hash?: string
          role?: 'super_admin' | 'admin'
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_id: string
          created_at: string
          expires_at: string
          id: string
          last_activity: string
          session_token: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_activity?: string
          session_token: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_activity?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          analytics_enabled: boolean
          catalog_enabled: boolean
          default_seo_description: string
          default_seo_title: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          maintenance_mode: boolean
          registration_enabled: boolean
          site_name: string
          updated_at: string
        }
        Insert: {
          analytics_enabled?: boolean
          catalog_enabled?: boolean
          default_seo_description?: string
          default_seo_title?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          maintenance_mode?: boolean
          registration_enabled?: boolean
          site_name?: string
          updated_at?: string
        }
        Update: {
          analytics_enabled?: boolean
          catalog_enabled?: boolean
          default_seo_description?: string
          default_seo_title?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          maintenance_mode?: boolean
          registration_enabled?: boolean
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_demos: {
        Row: {
          closing: Json
          couple: Json
          created_at: string
          events: Json
          gallery: Json
          gift: Json
          hero: Json
          id: string
          quote: Json
          rsvp: Json
          story: Json
          template_id: string
          updated_at: string
          wishes: Json
        }
        Insert: {
          closing?: Json
          couple?: Json
          created_at?: string
          events?: Json
          gallery?: Json
          gift?: Json
          hero?: Json
          id?: string
          quote?: Json
          rsvp?: Json
          story?: Json
          template_id: string
          updated_at?: string
          wishes?: Json
        }
        Update: {
          closing?: Json
          couple?: Json
          created_at?: string
          events?: Json
          gallery?: Json
          gift?: Json
          hero?: Json
          id?: string
          quote?: Json
          rsvp?: Json
          story?: Json
          template_id?: string
          updated_at?: string
          wishes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "template_demos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: true
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_logs: {
        Row: {
          action: string
          admin_id: string | null
          admin_username: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_username: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_username?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login: {
        Args: {
          p_username: string
          p_password: string
          p_client_ip?: string | null
          p_user_agent?: string | null
        }
        Returns: Json
      }
      admin_verify_session: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      admin_logout: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      get_admin_activity_logs: {
        Args: {
          p_token: string
          p_action_filter?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          admin_id: string | null
          admin_username: string
          action: string
          target_type: string | null
          target_id: string | null
          metadata: Json | null
          created_at: string
        }[]
      }
      admin_record_activity: {
        Args: {
          p_token: string
          p_action: string
          p_target_type?: string | null
          p_target_id?: string | null
          p_metadata?: Json | null
        }
        Returns: boolean
      }
      admin_update_profile: {
        Args: {
          p_token: string
          p_new_username: string
          p_display_name: string
        }
        Returns: Json
      }
      admin_duplicate_template: {
        Args: {
          p_token: string
          p_template_id: string
        }
        Returns: string
      }
      admin_list_accounts: {
        Args: {
          p_token: string
        }
        Returns: {
          id: string
          username: string
          role: string
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }[]
      }
      admin_create_account: {
        Args: {
          p_token: string
          p_new_username: string
          p_new_password: string
          p_new_role?: string
        }
        Returns: Json
      }
      admin_update_account: {
        Args: {
          p_token: string
          p_target_id: string
          p_username?: string | null
          p_role?: string | null
          p_is_active?: boolean | null
        }
        Returns: boolean
      }
      admin_reset_account_password: {
        Args: {
          p_token: string
          p_target_id: string
          p_new_password: string
        }
        Returns: boolean
      }
      admin_change_own_password: {
        Args: {
          p_token: string
          p_old_password: string
          p_new_password: string
        }
        Returns: boolean
      }
      admin_set_user_status: {
        Args: {
          p_token: string
          p_user_id: string
          p_status: string
        }
        Returns: boolean
      }
      admin_delete_user: {
        Args: {
          p_token: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_admin_invitations_list: {
        Args: {
          p_token: string
          p_search?: string | null
          p_status?: string | null
          p_template?: string | null
        }
        Returns: {
          id: string
          title: string
          slug: string
          status: string
          created_at: string
          updated_at: string
          published_at: string | null
          user_id: string
          owner_name: string | null
          owner_email: string
          template_id: string | null
          template_name: string | null
          template_slug: string | null
        }[]
      }
      get_template_demo_data: {
        Args: {
          p_slug: string
        }
        Returns: Json
      }
      admin_save_template_demo: {
        Args: {
          p_token: string
          p_template_id: string
          p_demo_data: Json
        }
        Returns: Json
      }
      get_system_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          site_name: string
          logo_url: string | null
          favicon_url: string | null
          default_seo_title: string
          default_seo_description: string
          maintenance_mode: boolean
          registration_enabled: boolean
          catalog_enabled: boolean
          analytics_enabled: boolean
        }
      }
      admin_update_system_settings: {
        Args: {
          p_token: string
          p_settings: Json
        }
        Returns: boolean
      }
      get_admin_dashboard_stats_v2: {
        Args: {
          p_token?: string | null
        }
        Returns: {
          total_users: number
          users_today: number
          total_invitations: number
          invitations_draft: number
          invitations_published: number
          total_templates: number
          active_templates: number
          total_page_views: number
          unique_visitors: number
          demo_template_views: number
          login_attempts: number
          error_events: number
        }
      }
      get_admin_traffic_logs: {
        Args: {
          p_token?: string | null
          p_days?: number
          p_limit?: number
        }
        Returns: {
          id: string
          event_name: string
          path: string
          session_id: string
          user_id: string | null
          template_id: string | null
          template_name: string | null
          invitation_id: string | null
          invitation_slug: string | null
          referrer: string | null
          device_type: string
          browser: string | null
          created_at: string
        }[]
      }
      get_admin_login_email: {
        Args: {
          p_username: string
        }
        Returns: string | null
      }
      get_admin_identity: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          username: string | null
          role: string
          email: string | null
          created_at: string
          updated_at: string
        }
      }
      update_admin_username: {
        Args: {
          p_new_username: string
        }
        Returns: {
          success: boolean
          username: string
        }
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_invitations: number
          total_templates: number
          active_templates: number
          draft_templates: number
          total_demo_views: number
          total_visitors: number
          total_invitation_views: number
        }
      }
      get_admin_traffic_stats: {
        Args: {
          period_days?: number
        }
        Returns: {
          day_date: string
          visitors: number
          page_views: number
          demo_views: number
          login_success: number
          register_success: number
          invitation_create: number
          invitation_publish: number
        }[]
      }
      get_admin_template_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          template_id: string
          name: string
          slug: string
          category: string
          status: string
          demo_views: number
          unique_visitors: number
          published_usage: number
        }[]
      }
      get_admin_users_list: {
        Args: {
          search_term?: string | null
          role_filter?: string | null
        }
        Returns: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: string
          created_at: string
          last_sign_in_at: string | null
          invitation_count: number
          published_count: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
