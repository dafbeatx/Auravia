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
          browser: string | null
          created_at: string
          device_type: 'desktop' | 'tablet' | 'mobile' | 'unknown'
          event_name: string
          id: string
          invitation_id: string | null
          path: string
          referrer: string | null
          session_id: string
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: 'desktop' | 'tablet' | 'mobile' | 'unknown'
          event_name: string
          id?: string
          invitation_id?: string | null
          path: string
          referrer?: string | null
          session_id: string
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: 'desktop' | 'tablet' | 'mobile' | 'unknown'
          event_name?: string
          id?: string
          invitation_id?: string | null
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: 'user' | 'admin'
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: 'user' | 'admin'
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
