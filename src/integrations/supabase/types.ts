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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          bot_id: string
          created_at: string
          date: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          service: string
          session_id: string | null
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          date: string
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          service: string
          session_id?: string | null
          status?: string
          time: string
          updated_at?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          date?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          service?: string
          session_id?: string | null
          status?: string
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_analytics: {
        Row: {
          avg_session_duration_seconds: number | null
          bot_id: string
          created_at: string
          date: string
          id: string
          total_chats: number
          total_messages: number
          total_users: number
          updated_at: string
        }
        Insert: {
          avg_session_duration_seconds?: number | null
          bot_id: string
          created_at?: string
          date?: string
          id?: string
          total_chats?: number
          total_messages?: number
          total_users?: number
          updated_at?: string
        }
        Update: {
          avg_session_duration_seconds?: number | null
          bot_id?: string
          created_at?: string
          date?: string
          id?: string
          total_chats?: number
          total_messages?: number
          total_users?: number
          updated_at?: string
        }
        Relationships: []
      }
      bot_location_analytics: {
        Row: {
          bot_id: string
          created_at: string
          date: string
          id: string
          location: string
          user_count: number
        }
        Insert: {
          bot_id: string
          created_at?: string
          date?: string
          id?: string
          location: string
          user_count?: number
        }
        Update: {
          bot_id?: string
          created_at?: string
          date?: string
          id?: string
          location?: string
          user_count?: number
        }
        Relationships: []
      }
      bots: {
        Row: {
          allowed_domains: string[] | null
          api_key: string | null
          avatar_url: string | null
          behavior_rules: string[] | null
          bot_plan_tier: string | null
          bot_id: string
          bot_type: string | null
          business_name: string | null
          contact_info: string | null
          created_at: string
          faqs: string | null
          greeting_message: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          locations: string | null
          message_limit: number | null
          name: string
          payment_methods: string | null
          policies: string | null
          primary_color: string | null
          services: string | null
          tags: string[] | null
          tone: string
          typing_speed: string
          updated_at: string
        }
        Insert: {
          allowed_domains?: string[] | null
          api_key?: string | null
          avatar_url?: string | null
          behavior_rules?: string[] | null
          bot_plan_tier?: string | null
          bot_id?: string
          bot_type?: string | null
          business_name?: string | null
          contact_info?: string | null
          created_at?: string
          faqs?: string | null
          greeting_message?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          locations?: string | null
          message_limit?: number | null
          name: string
          payment_methods?: string | null
          policies?: string | null
          primary_color?: string | null
          services?: string | null
          tags?: string[] | null
          tone?: string
          typing_speed?: string
          updated_at?: string
        }
        Update: {
          allowed_domains?: string[] | null
          api_key?: string | null
          avatar_url?: string | null
          behavior_rules?: string[] | null
          bot_plan_tier?: string | null
          bot_id?: string
          bot_type?: string | null
          business_name?: string | null
          contact_info?: string | null
          created_at?: string
          faqs?: string | null
          greeting_message?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          locations?: string | null
          message_limit?: number | null
          name?: string
          payment_methods?: string | null
          policies?: string | null
          primary_color?: string | null
          services?: string | null
          tags?: string[] | null
          tone?: string
          typing_speed?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          bot_id: string
          created_at: string
          ended_at: string | null
          flagged: boolean
          id: string
          location: string | null
          started_at: string
          status: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          ended_at?: string | null
          flagged?: boolean
          id?: string
          location?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          visitor_id?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          ended_at?: string | null
          flagged?: boolean
          id?: string
          location?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: []
      }
      generated_videos: {
        Row: {
          created_at: string
          id: string
          prompt: string
          style: string
          thumbnail_url: string | null
          user_id: string | null
          username: string | null
          video_concept: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          style: string
          thumbnail_url?: string | null
          user_id?: string | null
          username?: string | null
          video_concept: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          style?: string
          thumbnail_url?: string | null
          user_id?: string | null
          username?: string | null
          video_concept?: string
          video_url?: string | null
        }
        Relationships: []
      }
      owner_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      playgrounds: {
        Row: {
          bot_config: Json
          created_at: string
          current_view: string
          id: string
          messages: Json
          module_id: string | null
          name: string
          setup_step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_config?: Json
          created_at?: string
          current_view?: string
          id?: string
          messages?: Json
          module_id?: string | null
          name?: string
          setup_step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_config?: Json
          created_at?: string
          current_view?: string
          id?: string
          messages?: Json
          module_id?: string | null
          name?: string
          setup_step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          company_size: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          industry: string | null
          logo_url: string | null
          onboarding_complete: boolean | null
          plan: string
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          onboarding_complete?: boolean | null
          plan?: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          onboarding_complete?: boolean | null
          plan?: string
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_modelstack_api_key: {
        Args: { p_bot_type: string }
        Returns: string
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
    Enums: {},
  },
} as const
