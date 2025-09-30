export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      answer_submissions: {
        Row: {
          answer_time_ms: number
          game_question_id: string
          id: string
          is_correct: boolean
          selected_answer: string
          submitted_at: string
          submitted_by: string
          team_id: string
        }
        Insert: {
          answer_time_ms: number
          game_question_id: string
          id?: string
          is_correct: boolean
          selected_answer: string
          submitted_at?: string
          submitted_by: string
          team_id: string
        }
        Update: {
          answer_time_ms?: number
          game_question_id?: string
          id?: string
          is_correct?: boolean
          selected_answer?: string
          submitted_at?: string
          submitted_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_submissions_game_question_id_fkey"
            columns: ["game_question_id"]
            isOneToOne: false
            referencedRelation: "game_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_questions: {
        Row: {
          created_at: string
          display_order: number
          game_id: string
          id: string
          question_id: string
          randomization_seed: number
          revealed_at: string | null
          round_id: string
        }
        Insert: {
          created_at?: string
          display_order: number
          game_id: string
          id?: string
          question_id: string
          randomization_seed: number
          revealed_at?: string | null
          round_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          game_id?: string
          id?: string
          question_id?: string
          randomization_seed?: number
          revealed_at?: string | null
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_history"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "game_questions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_questions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          completed_at: string | null
          created_at: string
          current_question_index: number
          game_code: string
          host_id: string
          id: string
          max_players_per_team: number
          min_players_per_team: number
          name: string
          num_rounds: number
          questions_per_round: number
          scheduled_at: string | null
          sound_effects_enabled: boolean
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"]
          time_limit_seconds: number | null
          updated_at: string
          venue_location: string | null
          venue_name: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          game_code: string
          host_id: string
          id?: string
          max_players_per_team?: number
          min_players_per_team?: number
          name: string
          num_rounds: number
          questions_per_round: number
          scheduled_at?: string | null
          sound_effects_enabled?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          time_limit_seconds?: number | null
          updated_at?: string
          venue_location?: string | null
          venue_name?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_question_index?: number
          game_code?: string
          host_id?: string
          id?: string
          max_players_per_team?: number
          min_players_per_team?: number
          name?: string
          num_rounds?: number
          questions_per_round?: number
          scheduled_at?: string | null
          sound_effects_enabled?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"]
          time_limit_seconds?: number | null
          updated_at?: string
          venue_location?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      leaderboard_cache: {
        Row: {
          accuracy: number
          avg_score: number
          games_played: number
          games_won: number
          id: string
          last_updated: string
          player_id: string
          rank: number
          venue_name: string
          win_rate: number
        }
        Insert: {
          accuracy: number
          avg_score: number
          games_played: number
          games_won: number
          id?: string
          last_updated?: string
          player_id: string
          rank: number
          venue_name: string
          win_rate: number
        }
        Update: {
          accuracy?: number
          avg_score?: number
          games_played?: number
          games_won?: number
          id?: string
          last_updated?: string
          player_id?: string
          rank?: number
          venue_name?: string
          win_rate?: number
        }
        Relationships: []
      }
      player_profiles: {
        Row: {
          created_at: string
          display_name: string
          games_played: number
          games_won: number
          id: string
          is_anonymous: boolean
          total_correct_answers: number
          total_questions_answered: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          games_played?: number
          games_won?: number
          id: string
          is_anonymous?: boolean
          total_correct_answers?: number
          total_questions_answered?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          games_played?: number
          games_won?: number
          id?: string
          is_anonymous?: boolean
          total_correct_answers?: number
          total_questions_answered?: number
          updated_at?: string
        }
        Relationships: []
      }
      question_usage: {
        Row: {
          game_id: string
          host_id: string
          id: string
          question_id: string
          used_at: string
        }
        Insert: {
          game_id: string
          host_id: string
          id?: string
          question_id: string
          used_at?: string
        }
        Update: {
          game_id?: string
          host_id?: string
          id?: string
          question_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_usage_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_history"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "question_usage_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_usage_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_usage_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          a: string | null
          b: string | null
          c: string | null
          category: string
          created_at: string | null
          d: string | null
          id: string
          metadata: Json | null
          question: string
          updated_at: string | null
        }
        Insert: {
          a?: string | null
          b?: string | null
          c?: string | null
          category: string
          created_at?: string | null
          d?: string | null
          id: string
          metadata?: Json | null
          question: string
          updated_at?: string | null
        }
        Update: {
          a?: string | null
          b?: string | null
          c?: string | null
          category?: string
          created_at?: string | null
          d?: string | null
          id?: string
          metadata?: Json | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      rounds: {
        Row: {
          categories: string[]
          created_at: string
          game_id: string
          id: string
          round_number: number
        }
        Insert: {
          categories: string[]
          created_at?: string
          game_id: string
          id?: string
          round_number: number
        }
        Update: {
          categories?: string[]
          created_at?: string
          game_id?: string
          id?: string
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_history"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          player_id: string
          team_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          player_id: string
          team_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          cumulative_answer_time_ms: number
          game_id: string
          id: string
          score: number
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cumulative_answer_time_ms?: number
          game_id: string
          id?: string
          score?: number
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cumulative_answer_time_ms?: number
          game_id?: string
          id?: string
          score?: number
          team_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "game_history"
            referencedColumns: ["game_id"]
          },
          {
            foreignKeyName: "teams_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      game_history: {
        Row: {
          completed_at: string | null
          game_id: string | null
          game_name: string | null
          host_id: string | null
          num_players: number | null
          num_questions: number | null
          num_teams: number | null
          questions: Json[] | null
          venue_name: string | null
          winning_team: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          accuracy: number | null
          avg_score: number | null
          display_name: string | null
          games_played: number | null
          games_won: number | null
          player_id: string | null
          rank: number | null
          venue_name: string | null
          win_rate: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      count_available_questions: {
        Args: { p_categories: string[]; p_host_id: string }
        Returns: {
          in_all_categories: number
          in_selected_categories: number
        }[]
      }
      refresh_game_history: {
        Args: { p_game_id: string }
        Returns: undefined
      }
      refresh_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      select_questions_for_host: {
        Args: { p_categories: string[]; p_count: number; p_host_id: string }
        Returns: {
          answer_a: string
          answer_b: string
          answer_c: string
          answer_d: string
          category: string
          question: string
          question_id: string
        }[]
      }
    }
    Enums: {
      game_status: "setup" | "active" | "paused" | "completed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      game_status: ["setup", "active", "paused", "completed"],
    },
  },
} as const

