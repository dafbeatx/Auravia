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
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
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
          id: string
          is_active: boolean
          name: string
          slug: string
          thumbnail_url: string
        }
        Insert: {
          category: string
          created_at?: string
          default_sections?: Json
          default_theme?: Json
          description: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          thumbnail_url: string
        }
        Update: {
          category?: string
          created_at?: string
          default_sections?: Json
          default_theme?: Json
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          thumbnail_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
