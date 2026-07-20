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
      ai_suggestion_batches: {
        Row: {
          attempt_number: number | null
          capability: string | null
          completed_at: string | null
          created_at: string
          extra_context: string | null
          failure_code: string | null
          id: string
          model: string | null
          notice: string | null
          parent_task_id: string | null
          project_id: string | null
          prompt_version: string | null
          request_id: string | null
          schema_version: string | null
          started_at: string | null
          status: string
          supersedes_batch_id: string | null
          target_depth: number | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          attempt_number?: number | null
          capability?: string | null
          completed_at?: string | null
          created_at?: string
          extra_context?: string | null
          failure_code?: string | null
          id?: string
          model?: string | null
          notice?: string | null
          parent_task_id?: string | null
          project_id?: string | null
          prompt_version?: string | null
          request_id?: string | null
          schema_version?: string | null
          started_at?: string | null
          status?: string
          supersedes_batch_id?: string | null
          target_depth?: number | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          attempt_number?: number | null
          capability?: string | null
          completed_at?: string | null
          created_at?: string
          extra_context?: string | null
          failure_code?: string | null
          id?: string
          model?: string | null
          notice?: string | null
          parent_task_id?: string | null
          project_id?: string | null
          prompt_version?: string | null
          request_id?: string | null
          schema_version?: string | null
          started_at?: string | null
          status?: string
          supersedes_batch_id?: string | null
          target_depth?: number | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestion_batches_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestion_batches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestion_batches_supersedes_batch_id_fkey"
            columns: ["supersedes_batch_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestion_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestion_batches_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          accepted_at: string | null
          batch_id: string
          created_at: string
          description: string | null
          duplicate_task_id: string | null
          edited_description: string | null
          edited_title: string | null
          estimate: string | null
          id: string
          idempotency_key: string | null
          is_duplicate: boolean
          original_description: string | null
          original_title: string | null
          position: number | null
          rejected_at: string | null
          result_task_id: string | null
          smart_rationale: string | null
          status: string
          suggested_depth: number | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          batch_id: string
          created_at?: string
          description?: string | null
          duplicate_task_id?: string | null
          edited_description?: string | null
          edited_title?: string | null
          estimate?: string | null
          id?: string
          idempotency_key?: string | null
          is_duplicate?: boolean
          original_description?: string | null
          original_title?: string | null
          position?: number | null
          rejected_at?: string | null
          result_task_id?: string | null
          smart_rationale?: string | null
          status?: string
          suggested_depth?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          batch_id?: string
          created_at?: string
          description?: string | null
          duplicate_task_id?: string | null
          edited_description?: string | null
          edited_title?: string | null
          estimate?: string | null
          id?: string
          idempotency_key?: string | null
          is_duplicate?: boolean
          original_description?: string | null
          original_title?: string | null
          position?: number | null
          rejected_at?: string | null
          result_task_id?: string | null
          smart_rationale?: string | null
          status?: string
          suggested_depth?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ai_suggestion_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_duplicate_task_id_fkey"
            columns: ["duplicate_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_result_task_id_fkey"
            columns: ["result_task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          is_system: boolean
          name: string
          position: number
          system_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_system?: boolean
          name: string
          position?: number
          system_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_system?: boolean
          name?: string
          position?: number
          system_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          locale: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived_at: string | null
          area_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_duration: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          area_id: string | null
          completed_at: string | null
          created_at: string
          depth: number
          description: string | null
          id: string
          origin: Database["public"]["Enums"]["task_origin"]
          parent_task_id: string | null
          position: number
          project_id: string | null
          scheduled_date: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          area_id?: string | null
          completed_at?: string | null
          created_at?: string
          depth?: number
          description?: string | null
          id?: string
          origin?: Database["public"]["Enums"]["task_origin"]
          parent_task_id?: string | null
          position?: number
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          area_id?: string | null
          completed_at?: string | null
          created_at?: string
          depth?: number
          description?: string | null
          id?: string
          origin?: Database["public"]["Enums"]["task_origin"]
          parent_task_id?: string | null
          position?: number
          project_id?: string | null
          scheduled_date?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_ai_suggestion: {
        Args: {
          _edited_description?: string
          _edited_estimate?: string
          _edited_title?: string
          _suggestion_id: string
        }
        Returns: {
          already_accepted: boolean
          duplicate: boolean
          task_id: string
        }[]
      }
      delete_my_account_data: { Args: never; Returns: undefined }
      initialize_current_user: {
        Args: { p_display_name?: string }
        Returns: undefined
      }
    }
    Enums: {
      ai_batch_status: "pending" | "completed" | "failed"
      ai_suggestion_status: "pending" | "accepted" | "rejected"
      project_status: "active" | "completed" | "archived"
      task_origin: "manual" | "ai"
      task_status: "todo" | "done" | "archived"
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
      ai_batch_status: ["pending", "completed", "failed"],
      ai_suggestion_status: ["pending", "accepted", "rejected"],
      project_status: ["active", "completed", "archived"],
      task_origin: ["manual", "ai"],
      task_status: ["todo", "done", "archived"],
    },
  },
} as const
