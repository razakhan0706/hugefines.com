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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      fine_categories: {
        Row: {
          created_at: string
          default_amount: number
          id: string
          label: string
          team_id: string
        }
        Insert: {
          created_at?: string
          default_amount?: number
          id?: string
          label: string
          team_id: string
        }
        Update: {
          created_at?: string
          default_amount?: number
          id?: string
          label?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fine_categories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fines: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          id: string
          paid: boolean
          player_id: string
          round_id: string | null
          team_id: string
          week: number | null
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          paid?: boolean
          player_id: string
          round_id?: string | null
          team_id: string
          week?: number | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          paid?: boolean
          player_id?: string
          round_id?: string | null
          team_id?: string
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fines_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fines_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          created_at: string
          id: string
          jersey_number: number | null
          name: string
          nickname: string | null
          photo_url: string | null
          team_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          jersey_number?: number | null
          name: string
          nickname?: string | null
          photo_url?: string | null
          team_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          jersey_number?: number | null
          name?: string
          nickname?: string | null
          photo_url?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      recaps: {
        Row: {
          body: string
          created_at: string
          id: string
          round_id: string | null
          scope: string
          team_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          round_id?: string | null
          scope?: string
          team_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          round_id?: string | null
          scope?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recaps_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recaps_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          cap: number | null
          created_at: string
          day: number | null
          fines_master: string | null
          fines_master_photo_url: string | null
          id: string
          label: string | null
          opponent: string | null
          opponent_logo_url: string | null
          played_on: string | null
          result: string | null
          round_number: number
          team_id: string
          two_day: boolean
          venue: string | null
        }
        Insert: {
          cap?: number | null
          created_at?: string
          day?: number | null
          fines_master?: string | null
          fines_master_photo_url?: string | null
          id?: string
          label?: string | null
          opponent?: string | null
          opponent_logo_url?: string | null
          played_on?: string | null
          result?: string | null
          round_number: number
          team_id: string
          two_day?: boolean
          venue?: string | null
        }
        Update: {
          cap?: number | null
          created_at?: string
          day?: number | null
          fines_master?: string | null
          fines_master_photo_url?: string | null
          id?: string
          label?: string | null
          opponent?: string | null
          opponent_logo_url?: string | null
          played_on?: string | null
          result?: string | null
          round_number?: number
          team_id?: string
          two_day?: boolean
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rounds_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_access: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          invited_email: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          invited_email?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          invited_email?: string | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_access_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          accent_color: string
          created_at: string
          currency: string
          id: string
          is_public: boolean
          logo_url: string | null
          name: string
          owner_id: string
          player_limit: number
          season_name: string
          slug: string
          sport: string
          vote_format: string
          votes_public: boolean
        }
        Insert: {
          accent_color?: string
          created_at?: string
          currency?: string
          id?: string
          is_public?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          player_limit?: number
          season_name?: string
          slug: string
          sport?: string
          vote_format?: string
          votes_public?: boolean
        }
        Update: {
          accent_color?: string
          created_at?: string
          currency?: string
          id?: string
          is_public?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          player_limit?: number
          season_name?: string
          slug?: string
          sport?: string
          vote_format?: string
          votes_public?: boolean
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          id: string
          player_id: string
          points: number
          round_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          points: number
          round_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          points?: number
          round_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_team: { Args: { _team_id: string }; Returns: boolean }
      claim_team_invites: { Args: never; Returns: number }
      team_is_public: { Args: { _team_id: string }; Returns: boolean }
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
