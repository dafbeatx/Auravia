/**
 * AUROVIA DATABASE SCHEMA TYPES
 * 
 * SUMBER KEBENARAN: Aurovia Database & RLS Specification v1.3
 * 
 * STATUS: NEEDS GENERATION AFTER MIGRATION
 * File ini merupakan representasi tipe TypeScript awal yang dipetakan secara presisi
 * dari spesifikasi v1.3. Setelah migration SQL dieksekusi di database Supabase, file ini
 * akan digantikan sepenuhnya oleh output resmi: `supabase gen types typescript`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: 'wedding' | 'birthday' | 'corporate' | 'general';
          description: string;
          thumbnail_url: string;
          default_theme: Json;
          default_sections: Json;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category: 'wedding' | 'birthday' | 'corporate' | 'general';
          description: string;
          thumbnail_url: string;
          default_theme?: Json;
          default_sections?: Json;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category?: 'wedding' | 'birthday' | 'corporate' | 'general';
          description?: string;
          thumbnail_url?: string;
          default_theme?: Json;
          default_sections?: Json;
          is_active?: boolean;
          created_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          slug: string;
          title: string;
          event_type: string;
          status: 'draft' | 'published' | 'archived';
          allow_rsvp: boolean;
          show_wishes: boolean;
          theme_override: Json;
          settings: Json;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          slug: string;
          title: string;
          event_type?: string;
          status?: 'draft' | 'published' | 'archived';
          allow_rsvp?: boolean;
          show_wishes?: boolean;
          theme_override?: Json;
          settings?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          slug?: string;
          title?: string;
          event_type?: string;
          status?: 'draft' | 'published' | 'archived';
          allow_rsvp?: boolean;
          show_wishes?: boolean;
          theme_override?: Json;
          settings?: Json;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invitation_data: {
        Row: {
          id: string;
          invitation_id: string;
          content: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          content?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          content?: Json;
          updated_at?: string;
        };
      };
      invitation_sections: {
        Row: {
          id: string;
          invitation_id: string;
          section_type: string;
          variant: string;
          display_order: number;
          is_enabled: boolean;
          custom_config: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          section_type: string;
          variant?: string;
          display_order?: number;
          is_enabled?: boolean;
          custom_config?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          section_type?: string;
          variant?: string;
          display_order?: number;
          is_enabled?: boolean;
          custom_config?: Json;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          invitation_id: string;
          title: string;
          start_time: string;
          end_time: string | null;
          timezone: string;
          venue_name: string;
          address: string | null;
          maps_url: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          title: string;
          start_time: string;
          end_time?: string | null;
          timezone?: string;
          venue_name: string;
          address?: string | null;
          maps_url?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string | null;
          timezone?: string;
          venue_name?: string;
          address?: string | null;
          maps_url?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      gallery_items: {
        Row: {
          id: string;
          invitation_id: string;
          storage_path: string;
          thumbnail_path: string;
          caption: string | null;
          display_order: number;
          width: number | null;
          height: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          storage_path: string;
          thumbnail_path: string;
          caption?: string | null;
          display_order?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          storage_path?: string;
          thumbnail_path?: string;
          caption?: string | null;
          display_order?: number;
          width?: number | null;
          height?: number | null;
          created_at?: string;
        };
      };
      guests: {
        Row: {
          id: string;
          invitation_id: string;
          name: string;
          phone: string | null;
          pax_limit: number;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          name: string;
          phone?: string | null;
          pax_limit?: number;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          name?: string;
          phone?: string | null;
          pax_limit?: number;
          slug?: string;
          created_at?: string;
        };
      };
      rsvps: {
        Row: {
          id: string;
          invitation_id: string;
          guest_id: string | null;
          guest_name: string;
          status: 'attending' | 'declined' | 'tentative';
          pax_count: number;
          wishes: string | null;
          is_hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          invitation_id: string;
          guest_id?: string | null;
          guest_name: string;
          status: 'attending' | 'declined' | 'tentative';
          pax_count?: number;
          wishes?: string | null;
          is_hidden?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          invitation_id?: string;
          guest_id?: string | null;
          guest_name?: string;
          status?: 'attending' | 'declined' | 'tentative';
          pax_count?: number;
          wishes?: string | null;
          is_hidden?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
