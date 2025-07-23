export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          assistant_id: string
          client_name: string
          client_phone: string
          created_at: string
          description: string | null
          duration: number
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          assistant_id: string
          client_name: string
          client_phone: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          assistant_id?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_files: {
        Row: {
          assistant_id: string
          created_at: string
          file_id: string
          id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          file_id: string
          id?: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          file_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_files_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_knowledge_files: {
        Row: {
          assistant_id: string
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          openai_file_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          openai_file_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          openai_file_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistant_media: {
        Row: {
          assistant_id: string
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assistants: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          metadata: Json | null
          model: string
          name: string
          openai_assistant_id: string
          tools: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          model?: string
          name: string
          openai_assistant_id: string
          tools?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          model?: string
          name?: string
          openai_assistant_id?: string
          tools?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      authorized_emails: {
        Row: {
          added_at: string | null
          added_by: string | null
          email: string
          id: string
          notes: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          email: string
          id?: string
          notes?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          email?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          assistant_id: string
          calendar_id: string | null
          calendar_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          provider: string
          refresh_token: string | null
          sync_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          assistant_id: string
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          provider: string
          refresh_token?: string | null
          sync_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          assistant_id?: string
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token?: string | null
          sync_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_settings: {
        Row: {
          assistant_id: string
          buffer_time: number
          created_at: string
          id: string
          slot_duration: number
          timezone: string
          updated_at: string
          user_id: string
          working_days: number[]
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          assistant_id: string
          buffer_time?: number
          created_at?: string
          id?: string
          slot_duration?: number
          timezone?: string
          updated_at?: string
          user_id: string
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          assistant_id?: string
          buffer_time?: number
          created_at?: string
          id?: string
          slot_duration?: number
          timezone?: string
          updated_at?: string
          user_id?: string
          working_days?: number[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: []
      }
      calendar_sync_logs: {
        Row: {
          action: string
          appointment_id: string | null
          created_at: string
          error_message: string | null
          external_event_id: string | null
          id: string
          integration_id: string
          status: string
          sync_direction: string
        }
        Insert: {
          action: string
          appointment_id?: string | null
          created_at?: string
          error_message?: string | null
          external_event_id?: string | null
          id?: string
          integration_id: string
          status: string
          sync_direction: string
        }
        Update: {
          action?: string
          appointment_id?: string | null
          created_at?: string
          error_message?: string | null
          external_event_id?: string | null
          id?: string
          integration_id?: string
          status?: string
          sync_direction?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "calendar_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assistant_id: string
          created_at: string
          id: string
          is_active: boolean | null
          openai_thread_id: string
          title: string | null
          updated_at: string
          user_id: string
          whatsapp_contact: string | null
        }
        Insert: {
          assistant_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          openai_thread_id: string
          title?: string | null
          updated_at?: string
          user_id: string
          whatsapp_contact?: string | null
        }
        Update: {
          assistant_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          openai_thread_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_contact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checklist: {
        Row: {
          completed: boolean | null
          created_at: string
          date: string
          id: string
          task_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          date?: string
          id?: string
          task_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          date?: string
          id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          name: string
          openai_file_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          name: string
          openai_file_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          name?: string
          openai_file_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          openai_message_id: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          openai_message_id?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          openai_message_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_fluxogpt: {
        Row: {
          created_at: string | null
          emailuser: string | null
          id: number
          idassistentgpt: string | null
          message: string | null
          nomeinstancia: string | null
          threadid: string | null
          timeout: string | null
          whatsappuser: string | null
        }
        Insert: {
          created_at?: string | null
          emailuser?: string | null
          id: number
          idassistentgpt?: string | null
          message?: string | null
          nomeinstancia?: string | null
          threadid?: string | null
          timeout?: string | null
          whatsappuser?: string | null
        }
        Update: {
          created_at?: string | null
          emailuser?: string | null
          id?: number
          idassistentgpt?: string | null
          message?: string | null
          nomeinstancia?: string | null
          threadid?: string | null
          timeout?: string | null
          whatsappuser?: string | null
        }
        Relationships: []
      }
      paid_subscribers: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          email: string
          id: string
          payment_id: string | null
          payment_processor: string | null
          payment_status: string
          subscription_end: string | null
          subscription_start: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email: string
          id?: string
          payment_id?: string | null
          payment_processor?: string | null
          payment_status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          email?: string
          id?: string
          payment_id?: string | null
          payment_processor?: string | null
          payment_status?: string
          subscription_end?: string | null
          subscription_start?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_tracking: {
        Row: {
          created_at: string
          current_weight: number | null
          date: string
          diet_adherence: number | null
          exercise_completed: boolean | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          water_intake: number | null
        }
        Insert: {
          created_at?: string
          current_weight?: number | null
          date?: string
          diet_adherence?: number | null
          exercise_completed?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          water_intake?: number | null
        }
        Update: {
          created_at?: string
          current_weight?: number | null
          date?: string
          diet_adherence?: number | null
          exercise_completed?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          water_intake?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string
          food_preferences: string | null
          food_restrictions: string | null
          gender: string | null
          goal: string | null
          height: number | null
          id: string
          medical_conditions: string | null
          name: string
          target_weight: number | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          food_preferences?: string | null
          food_restrictions?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          medical_conditions?: string | null
          name: string
          target_weight?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          food_preferences?: string | null
          food_restrictions?: string | null
          gender?: string | null
          goal?: string | null
          height?: number | null
          id?: string
          medical_conditions?: string | null
          name?: string
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_quotas: {
        Row: {
          created_at: string
          id: string
          max_assistants: number
          max_whatsapp_connections: number
          plan_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_assistants?: number
          max_whatsapp_connections?: number
          plan_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_assistants?: number
          max_whatsapp_connections?: number
          plan_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          id: string
          instance_id: string
          instance_name: string
          phone_number: string | null
          qr_code: string | null
          status: string | null
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          id?: string
          instance_id: string
          instance_name: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          id?: string
          instance_id?: string
          instance_name?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_email: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_usage_stats: {
        Args: { target_user_id?: string }
        Returns: {
          user_id: string
          user_email: string
          max_assistants: number
          max_whatsapp_connections: number
          current_assistants: number
          current_whatsapp_connections: number
          plan_type: string
          created_at: string
        }[]
      }
      upgrade_user_to_paid: {
        Args: { target_email: string }
        Returns: undefined
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
