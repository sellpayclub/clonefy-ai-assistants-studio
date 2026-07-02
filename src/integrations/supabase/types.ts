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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          due_date: string
          id: string
          paid_amount: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          paid_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          paid_amount?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      accounts_receivable: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string
          description: string
          due_date: string
          id: string
          paid_amount: number | null
          sale_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id: string
          description: string
          due_date: string
          id?: string
          paid_amount?: number | null
          sale_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string
          description?: string
          due_date?: string
          id?: string
          paid_amount?: number | null
          sale_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      agendify_configs: {
        Row: {
          api_base_url: string
          assistant_id: string
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_base_url?: string
          assistant_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_base_url?: string
          assistant_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendify_configs_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: true
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_wallet_transactions: {
        Row: {
          amount_brl: number
          created_at: string
          description: string | null
          id: string
          openpix_charge_id: string | null
          openpix_correlation_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount_brl?: number
          created_at?: string
          description?: string | null
          id?: string
          openpix_charge_id?: string | null
          openpix_correlation_id?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string
          description?: string | null
          id?: string
          openpix_charge_id?: string | null
          openpix_correlation_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      api_wallets: {
        Row: {
          balance_brl: number
          created_at: string
          id: string
          low_balance_notified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_brl?: number
          created_at?: string
          id?: string
          low_balance_notified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_brl?: number
          created_at?: string
          id?: string
          low_balance_notified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      brands: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_register"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register: {
        Row: {
          closed_at: string | null
          closing_balance: number | null
          id: string
          notes: string | null
          opened_at: string | null
          opening_balance: number
          status: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opening_balance: number
          status?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closing_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opening_balance?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      commerce_analytics: {
        Row: {
          created_at: string | null
          customer_id: string | null
          data: Json | null
          event_type: string
          id: string
          order_id: string | null
          product_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          event_type: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          event_type?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_analytics_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "commerce_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_analytics_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "commerce_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "commerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_analytics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "commerce_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_conversations: {
        Row: {
          ai_summary: string | null
          assigned_to: string | null
          context: Json | null
          created_at: string | null
          current_cart: Json | null
          customer_id: string
          id: string
          last_message_at: string | null
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          assigned_to?: string | null
          context?: Json | null
          created_at?: string | null
          current_cart?: Json | null
          customer_id: string
          id?: string
          last_message_at?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          assigned_to?: string | null
          context?: Json | null
          created_at?: string | null
          current_cart?: Json | null
          customer_id?: string
          id?: string
          last_message_at?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "commerce_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_customers: {
        Row: {
          address: Json | null
          cpf: string | null
          created_at: string | null
          email: string | null
          first_contact_at: string | null
          id: string
          last_order_at: string | null
          name: string | null
          notes: string | null
          store_id: string
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          whatsapp_number: string
        }
        Insert: {
          address?: Json | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          first_contact_at?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          notes?: string | null
          store_id: string
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp_number: string
        }
        Update: {
          address?: Json | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          first_contact_at?: string | null
          id?: string
          last_order_at?: string | null
          name?: string | null
          notes?: string | null
          store_id?: string
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          media_url: string | null
          message_type: string | null
          metadata: Json | null
          product_id: string | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          product_id?: string | null
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          metadata?: Json | null
          product_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "commerce_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "commerce_products"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity?: number
          total_price: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "commerce_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "commerce_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "commerce_product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_orders: {
        Row: {
          created_at: string | null
          created_via: string | null
          customer_id: string
          delivered_at: string | null
          discount: number | null
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          status: string
          store_id: string
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_via?: string | null
          customer_id: string
          delivered_at?: string | null
          discount?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          store_id: string
          subtotal: number
          total: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_via?: string | null
          customer_id?: string
          delivered_at?: string | null
          discount?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "commerce_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_payment_settings: {
        Row: {
          created_at: string | null
          gateway_api_key: string | null
          gateway_name: string | null
          gateway_webhook_secret: string | null
          id: string
          is_enabled: boolean | null
          payment_method: string
          pix_holder_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          settings: Json | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gateway_api_key?: string | null
          gateway_name?: string | null
          gateway_webhook_secret?: string | null
          id?: string
          is_enabled?: boolean | null
          payment_method: string
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          settings?: Json | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gateway_api_key?: string | null
          gateway_name?: string | null
          gateway_webhook_secret?: string | null
          id?: string
          is_enabled?: boolean | null
          payment_method?: string
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          settings?: Json | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_payment_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "commerce_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "commerce_products"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_product_variants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          options: Json
          price: number | null
          product_id: string
          sku: string | null
          stock_quantity: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          options: Json
          price?: number | null
          product_id: string
          sku?: string | null
          stock_quantity?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          options?: Json
          price?: number | null
          product_id?: string
          sku?: string | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "commerce_products"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_products: {
        Row: {
          ai_selling_points: string | null
          allow_backorder: boolean | null
          barcode: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          name: string
          price: number
          short_description: string | null
          sku: string | null
          stock_quantity: number | null
          store_id: string
          tags: string[] | null
          track_stock: boolean | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          ai_selling_points?: string | null
          allow_backorder?: boolean | null
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name: string
          price: number
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number | null
          store_id: string
          tags?: string[] | null
          track_stock?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          ai_selling_points?: string | null
          allow_backorder?: boolean | null
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number | null
          store_id?: string
          tags?: string[] | null
          track_stock?: boolean | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "commerce_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "commerce_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_stores: {
        Row: {
          ai_instructions: string | null
          ai_personality: string | null
          banner_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          payment_instructions: string | null
          updated_at: string | null
          user_id: string
          welcome_message: string | null
          whatsapp_instance_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          ai_instructions?: string | null
          ai_personality?: string | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          payment_instructions?: string | null
          updated_at?: string | null
          user_id: string
          welcome_message?: string | null
          whatsapp_instance_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          ai_instructions?: string | null
          ai_personality?: string | null
          banner_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          payment_instructions?: string | null
          updated_at?: string | null
          user_id?: string
          welcome_message?: string | null
          whatsapp_instance_id?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
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
      crm_lead_attachments: {
        Row: {
          ai_description: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          lead_id: string | null
          mime_type: string | null
          source: string
          user_id: string
        }
        Insert: {
          ai_description?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          source?: string
          user_id: string
        }
        Update: {
          ai_description?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          lead_id?: string | null
          mime_type?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          address: string | null
          assistant_id: string | null
          company: string | null
          conversation_analysis: string | null
          cpf_cnpj: string | null
          created_at: string | null
          custom_fields: Json | null
          customer_questions: string[] | null
          email: string | null
          id: string
          intent_summary: string | null
          key_topics: string[] | null
          last_interaction: string | null
          lead_score: number | null
          name: string | null
          next_action: string | null
          objections: string[] | null
          pipeline_stage: string | null
          position: string | null
          products_mentioned: string[] | null
          sentiment: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          urgency_level: string | null
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          address?: string | null
          assistant_id?: string | null
          company?: string | null
          conversation_analysis?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          customer_questions?: string[] | null
          email?: string | null
          id?: string
          intent_summary?: string | null
          key_topics?: string[] | null
          last_interaction?: string | null
          lead_score?: number | null
          name?: string | null
          next_action?: string | null
          objections?: string[] | null
          pipeline_stage?: string | null
          position?: string | null
          products_mentioned?: string[] | null
          sentiment?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id: string
          whatsapp_number: string
        }
        Update: {
          address?: string | null
          assistant_id?: string | null
          company?: string | null
          conversation_analysis?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          customer_questions?: string[] | null
          email?: string | null
          id?: string
          intent_summary?: string | null
          key_topics?: string[] | null
          last_interaction?: string | null
          lead_score?: number | null
          name?: string | null
          next_action?: string | null
          objections?: string[] | null
          pipeline_stage?: string | null
          position?: string | null
          products_mentioned?: string[] | null
          sentiment?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          birth_date: string | null
          created_at: string | null
          id: string
          last_purchase: string | null
          name: string
          phone: string
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          id?: string
          last_purchase?: string | null
          name: string
          phone: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          id?: string
          last_purchase?: string | null
          name?: string
          phone?: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
      financial_accounts: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          monthly_income: number | null
          updated_at: string
          user_id: string
          whatsapp_connected: boolean | null
          whatsapp_instance_name: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          monthly_income?: number | null
          updated_at?: string
          user_id: string
          whatsapp_connected?: boolean | null
          whatsapp_instance_name?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          monthly_income?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_connected?: boolean | null
          whatsapp_instance_name?: string | null
        }
        Relationships: []
      }
      financial_budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          limit_amount: number
          month: string
          spent_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          limit_amount: number
          month: string
          spent_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          limit_amount?: number
          month?: string
          spent_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          budget_limit: number | null
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          type: string
          user_id: string
        }
        Insert: {
          budget_limit?: number | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type: string
          user_id: string
        }
        Update: {
          budget_limit?: number | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          ai_categorized: boolean | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          notes: string | null
          payment_method: string | null
          source: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_categorized?: boolean | null
          amount: number
          category?: string
          created_at?: string
          date?: string
          description: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          source?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_categorized?: boolean | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          source?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      followup_campaigns: {
        Row: {
          assistant_id: string | null
          business_description: string | null
          business_name: string | null
          common_objections: Json | null
          created_at: string | null
          description: string | null
          end_hour: number | null
          id: string
          important_links: Json | null
          is_connected: boolean | null
          max_daily_messages: number | null
          max_followups: number | null
          message_sequence: Json | null
          min_interval_minutes: number | null
          name: string
          openai_assistant_id: string | null
          random_delay_seconds: number | null
          start_hour: number | null
          status: string | null
          tone_of_voice: string | null
          total_conversions: number | null
          total_leads: number | null
          total_messages_sent: number | null
          total_responses: number | null
          updated_at: string | null
          user_id: string
          value_proposition: string | null
          whatsapp_instance: string | null
          whatsapp_instance_key: string | null
          whatsapp_qrcode: string | null
          whatsapp_status: string | null
          working_days: number[] | null
        }
        Insert: {
          assistant_id?: string | null
          business_description?: string | null
          business_name?: string | null
          common_objections?: Json | null
          created_at?: string | null
          description?: string | null
          end_hour?: number | null
          id?: string
          important_links?: Json | null
          is_connected?: boolean | null
          max_daily_messages?: number | null
          max_followups?: number | null
          message_sequence?: Json | null
          min_interval_minutes?: number | null
          name: string
          openai_assistant_id?: string | null
          random_delay_seconds?: number | null
          start_hour?: number | null
          status?: string | null
          tone_of_voice?: string | null
          total_conversions?: number | null
          total_leads?: number | null
          total_messages_sent?: number | null
          total_responses?: number | null
          updated_at?: string | null
          user_id: string
          value_proposition?: string | null
          whatsapp_instance?: string | null
          whatsapp_instance_key?: string | null
          whatsapp_qrcode?: string | null
          whatsapp_status?: string | null
          working_days?: number[] | null
        }
        Update: {
          assistant_id?: string | null
          business_description?: string | null
          business_name?: string | null
          common_objections?: Json | null
          created_at?: string | null
          description?: string | null
          end_hour?: number | null
          id?: string
          important_links?: Json | null
          is_connected?: boolean | null
          max_daily_messages?: number | null
          max_followups?: number | null
          message_sequence?: Json | null
          min_interval_minutes?: number | null
          name?: string
          openai_assistant_id?: string | null
          random_delay_seconds?: number | null
          start_hour?: number | null
          status?: string | null
          tone_of_voice?: string | null
          total_conversions?: number | null
          total_leads?: number | null
          total_messages_sent?: number | null
          total_responses?: number | null
          updated_at?: string | null
          user_id?: string
          value_proposition?: string | null
          whatsapp_instance?: string | null
          whatsapp_instance_key?: string | null
          whatsapp_qrcode?: string | null
          whatsapp_status?: string | null
          working_days?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_campaigns_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_leads: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          current_step: number | null
          custom_data: Json | null
          email: string | null
          human_takeover_until: string | null
          id: string
          intent_summary: string | null
          last_message_at: string | null
          last_response_at: string | null
          lead_score: number | null
          name: string
          next_followup_at: string | null
          notes: string | null
          openai_thread_id: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          total_messages_sent: number | null
          total_responses: number | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          current_step?: number | null
          custom_data?: Json | null
          email?: string | null
          human_takeover_until?: string | null
          id?: string
          intent_summary?: string | null
          last_message_at?: string | null
          last_response_at?: string | null
          lead_score?: number | null
          name: string
          next_followup_at?: string | null
          notes?: string | null
          openai_thread_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_messages_sent?: number | null
          total_responses?: number | null
          updated_at?: string | null
          user_id: string
          whatsapp_number: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          current_step?: number | null
          custom_data?: Json | null
          email?: string | null
          human_takeover_until?: string | null
          id?: string
          intent_summary?: string | null
          last_message_at?: string | null
          last_response_at?: string | null
          lead_score?: number | null
          name?: string
          next_followup_at?: string | null
          notes?: string | null
          openai_thread_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          total_messages_sent?: number | null
          total_responses?: number | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "followup_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_messages: {
        Row: {
          campaign_id: string
          content: string
          delivered_at: string | null
          direction: string
          id: string
          intent_detected: string | null
          lead_id: string
          lead_score_change: number | null
          read_at: string | null
          sent_at: string | null
          sentiment: string | null
          status: string | null
          step_number: number | null
        }
        Insert: {
          campaign_id: string
          content: string
          delivered_at?: string | null
          direction: string
          id?: string
          intent_detected?: string | null
          lead_id: string
          lead_score_change?: number | null
          read_at?: string | null
          sent_at?: string | null
          sentiment?: string | null
          status?: string | null
          step_number?: number | null
        }
        Update: {
          campaign_id?: string
          content?: string
          delivered_at?: string | null
          direction?: string
          id?: string
          intent_detected?: string | null
          lead_id?: string
          lead_score_change?: number | null
          read_at?: string | null
          sent_at?: string | null
          sentiment?: string | null
          status?: string | null
          step_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "followup_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "followup_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_schedules: {
        Row: {
          attempts: number | null
          campaign_id: string
          created_at: string | null
          error_message: string | null
          id: string
          lead_id: string
          message_template: string | null
          scheduled_at: string
          sent_at: string | null
          status: string | null
          step_number: number
        }
        Insert: {
          attempts?: number | null
          campaign_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_id: string
          message_template?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
          step_number: number
        }
        Update: {
          attempts?: number | null
          campaign_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string
          message_template?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "followup_schedules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "followup_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_schedules_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "followup_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      group_alerts: {
        Row: {
          group_id: string
          id: string
          keyword: string
          message_content: string
          sender_jid: string
          sender_name: string | null
          sent_at: string | null
          triggered_at: string | null
          was_sent: boolean | null
        }
        Insert: {
          group_id: string
          id?: string
          keyword: string
          message_content: string
          sender_jid: string
          sender_name?: string | null
          sent_at?: string | null
          triggered_at?: string | null
          was_sent?: boolean | null
        }
        Update: {
          group_id?: string
          id?: string
          keyword?: string
          message_content?: string
          sender_jid?: string
          sender_name?: string | null
          sent_at?: string | null
          triggered_at?: string | null
          was_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "group_alerts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string | null
          group_id: string
          id: string
          message_id: string
          message_timestamp: string
          message_type: string | null
          sender_jid: string
          sender_name: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          message_id: string
          message_timestamp: string
          message_type?: string | null
          sender_jid: string
          sender_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          message_id?: string
          message_timestamp?: string
          message_type?: string | null
          sender_jid?: string
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_participants: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          is_admin: boolean | null
          last_message_at: string | null
          message_count: number | null
          participant_jid: string
          participant_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          is_admin?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          participant_jid: string
          participant_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          is_admin?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          participant_jid?: string
          participant_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_participants_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_reports: {
        Row: {
          active_participants: string[] | null
          content: string
          created_at: string | null
          group_id: string
          id: string
          message_count: number | null
          report_date: string
          sent_at: string | null
          topics: string[] | null
          was_sent: boolean | null
        }
        Insert: {
          active_participants?: string[] | null
          content: string
          created_at?: string | null
          group_id: string
          id?: string
          message_count?: number | null
          report_date: string
          sent_at?: string | null
          topics?: string[] | null
          was_sent?: boolean | null
        }
        Update: {
          active_participants?: string[] | null
          content?: string
          created_at?: string | null
          group_id?: string
          id?: string
          message_count?: number | null
          report_date?: string
          sent_at?: string | null
          topics?: string[] | null
          was_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "group_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          assistant_id: string | null
          assistant_name: string | null
          contact_name: string | null
          contact_number: string
          content: string
          created_at: string | null
          id: string
          instance_name: string
          is_read: boolean | null
          media_url: string | null
          message_type: string | null
          sender_type: string
          session_id: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          assistant_name?: string | null
          contact_name?: string | null
          contact_number: string
          content: string
          created_at?: string | null
          id?: string
          instance_name: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          sender_type: string
          session_id?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          assistant_name?: string | null
          contact_name?: string | null
          contact_number?: string
          content?: string
          created_at?: string | null
          id?: string
          instance_name?: string
          is_read?: boolean | null
          media_url?: string | null
          message_type?: string | null
          sender_type?: string
          session_id?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_live_messages_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_sessions: {
        Row: {
          assistant_id: string | null
          assistant_name: string | null
          contact_name: string | null
          contact_number: string
          created_at: string | null
          human_takeover_until: string | null
          id: string
          instance_name: string
          last_message_at: string | null
          last_message_preview: string | null
          last_sender_type: string | null
          source: string
          status: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          assistant_name?: string | null
          contact_name?: string | null
          contact_number: string
          created_at?: string | null
          human_takeover_until?: string | null
          id?: string
          instance_name: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sender_type?: string | null
          source: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          assistant_name?: string | null
          contact_name?: string | null
          contact_number?: string
          created_at?: string | null
          human_takeover_until?: string | null
          id?: string
          instance_name?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sender_type?: string | null
          source?: string
          status?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string | null
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
      meta_connections: {
        Row: {
          assistant_id: string | null
          created_at: string
          id: string
          instagram_account_id: string | null
          is_active: boolean
          page_access_token: string
          page_id: string
          platform: string
          updated_at: string
          user_id: string
          webhook_verify_token: string
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          instagram_account_id?: string | null
          is_active?: boolean
          page_access_token: string
          page_id: string
          platform: string
          updated_at?: string
          user_id: string
          webhook_verify_token?: string
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          instagram_account_id?: string | null
          is_active?: boolean
          page_access_token?: string
          page_id?: string
          platform?: string
          updated_at?: string
          user_id?: string
          webhook_verify_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_connections_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_fluxogpt: {
        Row: {
          ApiELEVEN: string | null
          created_at: string | null
          emailuser: string | null
          followup_count: number | null
          followup_delay_minutes: number
          followup_enabled: boolean
          human_takeover_until: string | null
          id: number
          idassistentgpt: string | null
          IDvoz: string | null
          last_message_at: string | null
          last_sender: string | null
          message: string | null
          nomeinstancia: string | null
          threadid: string | null
          timeout: string | null
          whatsappuser: string | null
        }
        Insert: {
          ApiELEVEN?: string | null
          created_at?: string | null
          emailuser?: string | null
          followup_count?: number | null
          followup_delay_minutes?: number
          followup_enabled?: boolean
          human_takeover_until?: string | null
          id?: number
          idassistentgpt?: string | null
          IDvoz?: string | null
          last_message_at?: string | null
          last_sender?: string | null
          message?: string | null
          nomeinstancia?: string | null
          threadid?: string | null
          timeout?: string | null
          whatsappuser?: string | null
        }
        Update: {
          ApiELEVEN?: string | null
          created_at?: string | null
          emailuser?: string | null
          followup_count?: number | null
          followup_delay_minutes?: number
          followup_enabled?: boolean
          human_takeover_until?: string | null
          id?: number
          idassistentgpt?: string | null
          IDvoz?: string | null
          last_message_at?: string | null
          last_sender?: string | null
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
      product_variants: {
        Row: {
          color: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          size: string
          updated_at: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          size: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          size?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          cost_price: number
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          min_stock: number | null
          name: string
          profit_margin: number | null
          sale_price: number
          sku: string
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          cost_price: number
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name: string
          profit_margin?: number | null
          sale_price: number
          sku: string
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_stock?: number | null
          name?: string
          profit_margin?: number | null
          sale_price?: number
          sku?: string
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
      prospect_outreach_campaigns: {
        Row: {
          assistant_id: string | null
          created_at: string
          delay_seconds: number
          failed_count: number
          id: string
          import_to_crm: boolean
          message_template: string
          name: string
          search_context: Json | null
          sent_count: number
          skipped_count: number
          status: string
          total_leads: number
          updated_at: string
          user_id: string
          whatsapp_instance: string
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          delay_seconds?: number
          failed_count?: number
          id?: string
          import_to_crm?: boolean
          message_template: string
          name?: string
          search_context?: Json | null
          sent_count?: number
          skipped_count?: number
          status?: string
          total_leads?: number
          updated_at?: string
          user_id: string
          whatsapp_instance: string
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          delay_seconds?: number
          failed_count?: number
          id?: string
          import_to_crm?: boolean
          message_template?: string
          name?: string
          search_context?: Json | null
          sent_count?: number
          skipped_count?: number
          status?: string
          total_leads?: number
          updated_at?: string
          user_id?: string
          whatsapp_instance?: string
        }
        Relationships: []
      }
      prospect_outreach_queue: {
        Row: {
          attempts: number
          campaign_id: string
          cnpj: string
          created_at: string
          crm_lead_id: string | null
          error_message: string | null
          id: string
          lead_name: string
          message_body: string
          scheduled_at: string
          sent_at: string | null
          status: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          attempts?: number
          campaign_id: string
          cnpj: string
          created_at?: string
          crm_lead_id?: string | null
          error_message?: string | null
          id?: string
          lead_name: string
          message_body: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          user_id: string
          whatsapp_number: string
        }
        Update: {
          attempts?: number
          campaign_id?: string
          cnpj?: string
          created_at?: string
          crm_lead_id?: string | null
          error_message?: string | null
          id?: string
          lead_name?: string
          message_body?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_outreach_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "prospect_outreach_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_outreach_queue_crm_lead_id_fkey"
            columns: ["crm_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_register_id: string | null
          change_amount: number | null
          created_at: string | null
          customer_id: string | null
          discount: number | null
          id: string
          installments: number | null
          payment_method: string
          sale_number: number
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cash_register_id?: string | null
          change_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          installments?: number | null
          payment_method: string
          sale_number?: number
          status?: string
          subtotal: number
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cash_register_id?: string | null
          change_amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount?: number | null
          id?: string
          installments?: number | null
          payment_method?: string
          sale_number?: number
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_register"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          sale_id: string | null
          type: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          sale_id?: string | null
          type: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          sale_id?: string | null
          type?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          phone: string | null
          store_name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          store_name?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          store_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      telegram_connections: {
        Row: {
          assistant_id: string | null
          bot_name: string | null
          bot_token: string
          bot_username: string | null
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          assistant_id?: string | null
          bot_name?: string | null
          bot_token: string
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          assistant_id?: string | null
          bot_name?: string | null
          bot_token?: string
          bot_username?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_connections_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_threads: {
        Row: {
          assistant_id: string | null
          bot_token: string
          contact_name: string | null
          created_at: string
          id: string
          openai_thread_id: string
          telegram_chat_id: number
          user_id: string
        }
        Insert: {
          assistant_id?: string | null
          bot_token: string
          contact_name?: string | null
          created_at?: string
          id?: string
          openai_thread_id: string
          telegram_chat_id: number
          user_id: string
        }
        Update: {
          assistant_id?: string | null
          bot_token?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          openai_thread_id?: string
          telegram_chat_id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_branding: {
        Row: {
          accent_color: string | null
          company_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          logo_dark_url: string | null
          logo_icon_url: string | null
          logo_light_url: string | null
          primary_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_dark_url?: string | null
          logo_icon_url?: string | null
          logo_light_url?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          company_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_dark_url?: string | null
          logo_icon_url?: string | null
          logo_light_url?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id?: string
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
      user_roles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
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
      whatsapp_groups: {
        Row: {
          alerts_enabled: boolean | null
          created_at: string | null
          group_description: string | null
          group_jid: string
          group_name: string
          group_picture_url: string | null
          id: string
          instance_name: string
          is_active: boolean | null
          keywords: string[] | null
          last_message_at: string | null
          last_report_at: string | null
          report_enabled: boolean | null
          report_time: string | null
          total_messages: number | null
          total_participants: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean | null
          created_at?: string | null
          group_description?: string | null
          group_jid: string
          group_name: string
          group_picture_url?: string | null
          id?: string
          instance_name: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_message_at?: string | null
          last_report_at?: string | null
          report_enabled?: boolean | null
          report_time?: string | null
          total_messages?: number | null
          total_participants?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean | null
          created_at?: string | null
          group_description?: string | null
          group_jid?: string
          group_name?: string
          group_picture_url?: string | null
          id?: string
          instance_name?: string
          is_active?: boolean | null
          keywords?: string[] | null
          last_message_at?: string | null
          last_report_at?: string | null
          report_enabled?: boolean | null
          report_time?: string | null
          total_messages?: number | null
          total_participants?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_takeover_settings: {
        Row: {
          auto_takeover_hours: number
          created_at: string | null
          id: string
          instance_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_takeover_hours?: number
          created_at?: string | null
          id?: string
          instance_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_takeover_hours?: number
          created_at?: string | null
          id?: string
          instance_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_test_controls: {
        Row: {
          assistant_id: string | null
          created_at: string
          delay_seconds: number | null
          evolution_api_key: string | null
          evolution_api_url: string | null
          id: string
          instance_name: string
          is_active: boolean | null
          message_break_enabled: boolean | null
          pause_minutes: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          delay_seconds?: number | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name: string
          is_active?: boolean | null
          message_break_enabled?: boolean | null
          pause_minutes?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          delay_seconds?: number | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          id?: string
          instance_name?: string
          is_active?: boolean | null
          message_break_enabled?: boolean | null
          pause_minutes?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_test_conversations: {
        Row: {
          assistant_id: string | null
          contact_name: string | null
          contact_number: string
          created_at: string
          id: string
          instance_name: string
          is_paused: boolean | null
          last_owner_message_at: string | null
          openai_thread_id: string | null
          paused_until: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          contact_name?: string | null
          contact_number: string
          created_at?: string
          id?: string
          instance_name: string
          is_paused?: boolean | null
          last_owner_message_at?: string | null
          openai_thread_id?: string | null
          paused_until?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          contact_name?: string | null
          contact_number?: string
          created_at?: string
          id?: string
          instance_name?: string
          is_paused?: boolean | null
          last_owner_message_at?: string | null
          openai_thread_id?: string | null
          paused_until?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      whatsapp_test_messages: {
        Row: {
          ai_response: string | null
          contact_number: string
          conversation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          instance_name: string
          is_from_owner: boolean | null
          message_content: string | null
          message_id: string | null
          message_media_url: string | null
          message_type: string
          processed: boolean | null
        }
        Insert: {
          ai_response?: string | null
          contact_number: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_name: string
          is_from_owner?: boolean | null
          message_content?: string | null
          message_id?: string | null
          message_media_url?: string | null
          message_type: string
          processed?: boolean | null
        }
        Update: {
          ai_response?: string | null
          contact_number?: string
          conversation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          instance_name?: string
          is_from_owner?: boolean | null
          message_content?: string | null
          message_id?: string | null
          message_media_url?: string | null
          message_type?: string
          processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_test_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_test_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_test_queue: {
        Row: {
          contact_number: string
          created_at: string
          id: string
          instance_name: string
          messages: Json[] | null
          process_at: string
          processed_at: string | null
          status: string | null
        }
        Insert: {
          contact_number: string
          created_at?: string
          id?: string
          instance_name: string
          messages?: Json[] | null
          process_at: string
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          contact_number?: string
          created_at?: string
          id?: string
          instance_name?: string
          messages?: Json[] | null
          process_at?: string
          processed_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      widget_analytics: {
        Row: {
          assistant_id: string
          avg_session_duration: string | null
          created_at: string
          date: string
          id: string
          total_bot_messages: number
          total_conversations: number
          total_messages: number
          total_user_messages: number
          unique_visitors: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_id: string
          avg_session_duration?: string | null
          created_at?: string
          date?: string
          id?: string
          total_bot_messages?: number
          total_conversations?: number
          total_messages?: number
          total_user_messages?: number
          unique_visitors?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_id?: string
          avg_session_duration?: string | null
          created_at?: string
          date?: string
          id?: string
          total_bot_messages?: number
          total_conversations?: number
          total_messages?: number
          total_user_messages?: number
          unique_visitors?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      widget_customizations: {
        Row: {
          action_buttons: Json | null
          assistant_id: string
          avatar_url: string | null
          bubble_message: string | null
          button_icon_url: string | null
          button_position: string
          created_at: string
          id: string
          is_active: boolean
          primary_color: string
          quick_questions: Json | null
          secondary_color: string
          show_status_indicator: boolean | null
          status_text: string | null
          text_color: string
          updated_at: string
          user_id: string
          welcome_message: string | null
          widget_name: string
          widget_template: string | null
        }
        Insert: {
          action_buttons?: Json | null
          assistant_id: string
          avatar_url?: string | null
          bubble_message?: string | null
          button_icon_url?: string | null
          button_position?: string
          created_at?: string
          id?: string
          is_active?: boolean
          primary_color?: string
          quick_questions?: Json | null
          secondary_color?: string
          show_status_indicator?: boolean | null
          status_text?: string | null
          text_color?: string
          updated_at?: string
          user_id: string
          welcome_message?: string | null
          widget_name?: string
          widget_template?: string | null
        }
        Update: {
          action_buttons?: Json | null
          assistant_id?: string
          avatar_url?: string | null
          bubble_message?: string | null
          button_icon_url?: string | null
          button_position?: string
          created_at?: string
          id?: string
          is_active?: boolean
          primary_color?: string
          quick_questions?: Json | null
          secondary_color?: string
          show_status_indicator?: boolean | null
          status_text?: string | null
          text_color?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
          widget_name?: string
          widget_template?: string | null
        }
        Relationships: []
      }
      widget_sessions: {
        Row: {
          assistant_id: string
          conversation_id: string | null
          created_at: string
          end_time: string | null
          id: string
          messages_count: number
          session_id: string
          start_time: string
          updated_at: string
          user_agent: string | null
          user_id: string
          visitor_ip: string | null
        }
        Insert: {
          assistant_id: string
          conversation_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          messages_count?: number
          session_id: string
          start_time?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
          visitor_ip?: string | null
        }
        Update: {
          assistant_id?: string
          conversation_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          messages_count?: number
          session_id?: string
          start_time?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          visitor_ip?: string | null
        }
        Relationships: []
      }
      zapslim_admin_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          payload: Json | null
          profile_id: string | null
          read_at: string | null
          severity: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          payload?: Json | null
          profile_id?: string | null
          read_at?: string | null
          severity?: string
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          payload?: Json | null
          profile_id?: string | null
          read_at?: string | null
          severity?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_admin_notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_admin_notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_ai_reports: {
        Row: {
          content: string
          created_at: string
          id: string
          profile_id: string
          report_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          profile_id: string
          report_type: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_ai_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_ai_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_body_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          profile_id: string
          storage_path: string
          taken_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          profile_id: string
          storage_path: string
          taken_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string
          storage_path?: string
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_body_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_body_photos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_campaign_sends: {
        Row: {
          campaign_id: string
          created_at: string
          error_message: string | null
          evolution_message_id: string | null
          id: string
          profile_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["zs_campaign_send_status"]
          whatsapp_phone: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          profile_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["zs_campaign_send_status"]
          whatsapp_phone: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          profile_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["zs_campaign_send_status"]
          whatsapp_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "zapslim_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zapslim_campaign_sends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_campaign_sends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_campaigns: {
        Row: {
          audience_filter: Json
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          image_storage_path: string | null
          link_url: string | null
          message_text: string
          name: string
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["zs_campaign_status"]
          total_failed: number
          total_sent: number
          total_skipped: number
          total_target: number
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_storage_path?: string | null
          link_url?: string | null
          message_text: string
          name: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["zs_campaign_status"]
          total_failed?: number
          total_sent?: number
          total_skipped?: number
          total_target?: number
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_storage_path?: string | null
          link_url?: string | null
          message_text?: string
          name?: string
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["zs_campaign_status"]
          total_failed?: number
          total_sent?: number
          total_skipped?: number
          total_target?: number
          updated_at?: string
        }
        Relationships: []
      }
      zapslim_dose_entries: {
        Row: {
          applied_at: string
          created_at: string
          dose: string
          id: string
          injection_site: string | null
          medication: string | null
          notes: string | null
          profile_id: string
          side_effects: string | null
        }
        Insert: {
          applied_at?: string
          created_at?: string
          dose: string
          id?: string
          injection_site?: string | null
          medication?: string | null
          notes?: string | null
          profile_id: string
          side_effects?: string | null
        }
        Update: {
          applied_at?: string
          created_at?: string
          dose?: string
          id?: string
          injection_site?: string | null
          medication?: string | null
          notes?: string | null
          profile_id?: string
          side_effects?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_dose_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_dose_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_login_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          whatsapp_phone: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          whatsapp_phone: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          whatsapp_phone?: string
        }
        Relationships: []
      }
      zapslim_meal_logs: {
        Row: {
          ai_analysis: string | null
          calories: number | null
          carbs_g: number | null
          created_at: string
          description: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          profile_id: string
          protein_g: number | null
          recorded_at: string
          storage_path: string | null
          tips: string | null
        }
        Insert: {
          ai_analysis?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          profile_id: string
          protein_g?: number | null
          recorded_at?: string
          storage_path?: string | null
          tips?: string | null
        }
        Update: {
          ai_analysis?: string | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          profile_id?: string
          protein_g?: number | null
          recorded_at?: string
          storage_path?: string | null
          tips?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_meal_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_meal_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_message_logs: {
        Row: {
          ai_extracted: Json | null
          channel: string
          content: string | null
          created_at: string
          direction: Database["public"]["Enums"]["zs_message_direction"]
          evolution_message_id: string | null
          id: string
          media_url: string | null
          message_type: Database["public"]["Enums"]["zs_message_type"]
          profile_id: string
        }
        Insert: {
          ai_extracted?: Json | null
          channel?: string
          content?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["zs_message_direction"]
          evolution_message_id?: string | null
          id?: string
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["zs_message_type"]
          profile_id: string
        }
        Update: {
          ai_extracted?: Json | null
          channel?: string
          content?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["zs_message_direction"]
          evolution_message_id?: string | null
          id?: string
          media_url?: string | null
          message_type?: Database["public"]["Enums"]["zs_message_type"]
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_message_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_message_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_profiles: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_dose: string | null
          current_weight_kg: number | null
          dashboard_slug: string
          full_name: string | null
          id: string
          initial_weight_kg: number | null
          insights_updated_at: string | null
          kiwify_customer_id: string | null
          kiwify_email: string | null
          kiwify_subscription_id: string | null
          last_checkin_at: string | null
          last_dose_at: string | null
          last_log_at: string | null
          last_message_at: string | null
          latest_insights: string | null
          locale: string
          marketing_opt_out: boolean
          marketing_opt_out_at: string | null
          medication: Database["public"]["Enums"]["zs_medication_type"] | null
          medication_other: string | null
          onboarding_completed: boolean
          onboarding_step: Database["public"]["Enums"]["zs_onboarding_step"]
          pending_image_caption: string | null
          pending_image_path: string | null
          short_code: string | null
          streak_days: number
          subscription_status: Database["public"]["Enums"]["zs_subscription_status"]
          target_weight_kg: number | null
          timezone: string
          tutorial_completed: boolean
          updated_at: string
          weight_loss_method: string | null
          welcome_sent_at: string | null
          whatsapp_phone: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_dose?: string | null
          current_weight_kg?: number | null
          dashboard_slug?: string
          full_name?: string | null
          id?: string
          initial_weight_kg?: number | null
          insights_updated_at?: string | null
          kiwify_customer_id?: string | null
          kiwify_email?: string | null
          kiwify_subscription_id?: string | null
          last_checkin_at?: string | null
          last_dose_at?: string | null
          last_log_at?: string | null
          last_message_at?: string | null
          latest_insights?: string | null
          locale?: string
          marketing_opt_out?: boolean
          marketing_opt_out_at?: string | null
          medication?: Database["public"]["Enums"]["zs_medication_type"] | null
          medication_other?: string | null
          onboarding_completed?: boolean
          onboarding_step?: Database["public"]["Enums"]["zs_onboarding_step"]
          pending_image_caption?: string | null
          pending_image_path?: string | null
          short_code?: string | null
          streak_days?: number
          subscription_status?: Database["public"]["Enums"]["zs_subscription_status"]
          target_weight_kg?: number | null
          timezone?: string
          tutorial_completed?: boolean
          updated_at?: string
          weight_loss_method?: string | null
          welcome_sent_at?: string | null
          whatsapp_phone: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_dose?: string | null
          current_weight_kg?: number | null
          dashboard_slug?: string
          full_name?: string | null
          id?: string
          initial_weight_kg?: number | null
          insights_updated_at?: string | null
          kiwify_customer_id?: string | null
          kiwify_email?: string | null
          kiwify_subscription_id?: string | null
          last_checkin_at?: string | null
          last_dose_at?: string | null
          last_log_at?: string | null
          last_message_at?: string | null
          latest_insights?: string | null
          locale?: string
          marketing_opt_out?: boolean
          marketing_opt_out_at?: string | null
          medication?: Database["public"]["Enums"]["zs_medication_type"] | null
          medication_other?: string | null
          onboarding_completed?: boolean
          onboarding_step?: Database["public"]["Enums"]["zs_onboarding_step"]
          pending_image_caption?: string | null
          pending_image_path?: string | null
          short_code?: string | null
          streak_days?: number
          subscription_status?: Database["public"]["Enums"]["zs_subscription_status"]
          target_weight_kg?: number | null
          timezone?: string
          tutorial_completed?: boolean
          updated_at?: string
          weight_loss_method?: string | null
          welcome_sent_at?: string | null
          whatsapp_phone?: string
        }
        Relationships: []
      }
      zapslim_reminders: {
        Row: {
          created_at: string
          custom_message: string | null
          days_of_week: number[]
          enabled: boolean
          id: string
          last_sent_at: string | null
          next_run_at: string | null
          profile_id: string
          time_local: string
          type: Database["public"]["Enums"]["zs_reminder_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_message?: string | null
          days_of_week?: number[]
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          next_run_at?: string | null
          profile_id: string
          time_local?: string
          type: Database["public"]["Enums"]["zs_reminder_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_message?: string | null
          days_of_week?: number[]
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          next_run_at?: string | null
          profile_id?: string
          time_local?: string
          type?: Database["public"]["Enums"]["zs_reminder_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_reminders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_subscription_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_subscription_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_subscription_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_weight_entries: {
        Row: {
          created_at: string
          id: string
          mood: string | null
          notes: string | null
          profile_id: string
          raw_message: string | null
          recorded_at: string
          symptoms: string[] | null
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          mood?: string | null
          notes?: string | null
          profile_id: string
          raw_message?: string | null
          recorded_at?: string
          symptoms?: string[] | null
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string | null
          notes?: string | null
          profile_id?: string
          raw_message?: string | null
          recorded_at?: string
          symptoms?: string[] | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_weight_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_weight_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      zapslim_workout_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          profile_id: string
          recorded_at: string
          trained: boolean
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          profile_id: string
          recorded_at?: string
          trained?: boolean
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          profile_id?: string
          recorded_at?: string
          trained?: boolean
          workout_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zapslim_workout_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profile_progress"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "zapslim_workout_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "zapslim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      zapslim_profile_progress: {
        Row: {
          current_weight_kg: number | null
          dashboard_slug: string | null
          full_name: string | null
          goal_percent: number | null
          initial_weight_kg: number | null
          profile_id: string | null
          streak_days: number | null
          target_weight_kg: number | null
          total_lost_kg: number | null
        }
        Insert: {
          current_weight_kg?: number | null
          dashboard_slug?: string | null
          full_name?: string | null
          goal_percent?: never
          initial_weight_kg?: number | null
          profile_id?: string | null
          streak_days?: number | null
          target_weight_kg?: number | null
          total_lost_kg?: never
        }
        Update: {
          current_weight_kg?: number | null
          dashboard_slug?: string | null
          full_name?: string | null
          goal_percent?: never
          initial_weight_kg?: number | null
          profile_id?: string | null
          streak_days?: number | null
          target_weight_kg?: number | null
          total_lost_kg?: never
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_all_leads: {
        Args: { target_user_id?: string }
        Returns: {
          company: string
          created_at: string
          email: string
          id: string
          intent_summary: string
          last_interaction: string
          lead_score: number
          name: string
          pipeline_stage: string
          sentiment: string
          source: string
          status: string
          tags: string[]
          user_email: string
          user_id: string
          whatsapp_number: string
        }[]
      }
      admin_get_all_sessions: {
        Args: { target_user_id?: string }
        Returns: {
          assistant_name: string
          contact_name: string
          contact_number: string
          created_at: string
          id: string
          instance_name: string
          last_message_at: string
          last_message_preview: string
          source: string
          status: string
          unread_count: number
          user_email: string
          user_id: string
        }[]
      }
      admin_get_global_stats: { Args: never; Returns: Json }
      cleanup_old_group_messages: { Args: never; Returns: undefined }
      credit_api_wallet: {
        Args: { _amount: number; _correlation_id?: string; _user_id: string }
        Returns: number
      }
      debit_api_wallet: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      disparar_followup_clonefy: { Args: never; Returns: undefined }
      disparar_followups_automaticos: { Args: never; Returns: undefined }
      find_or_create_customer: {
        Args: { p_name?: string; p_store_id: string; p_whatsapp_number: string }
        Returns: string
      }
      generate_order_number: { Args: { store_uuid: string }; Returns: string }
      get_user_email: { Args: { target_user_id: string }; Returns: string }
      get_user_id_by_email: { Args: { target_email: string }; Returns: string }
      get_user_usage_stats: {
        Args: { target_user_id?: string }
        Returns: {
          created_at: string
          current_assistants: number
          current_whatsapp_connections: number
          max_assistants: number
          max_whatsapp_connections: number
          plan_type: string
          user_email: string
          user_id: string
        }[]
      }
      get_wallet_status: {
        Args: { _user_id: string }
        Returns: {
          balance: number
          is_empty: boolean
          is_low: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_campaign_counters: {
        Args: {
          p_campaign_id: string
          p_failed: number
          p_sent: number
          p_skipped: number
        }
        Returns: undefined
      }
      process_prospect_outreach_queue: { Args: never; Returns: undefined }
      search_store_products: {
        Args: {
          p_category_id?: string
          p_limit?: number
          p_query?: string
          p_store_id: string
        }
        Returns: {
          ai_selling_points: string
          category_name: string
          compare_at_price: number
          description: string
          id: string
          is_active: boolean
          name: string
          price: number
          primary_image_url: string
          short_description: string
          stock_quantity: number
        }[]
      }
      upgrade_user_to_paid: {
        Args: { target_email: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "admin" | "vendedora"
      zs_campaign_send_status: "pending" | "sent" | "failed" | "skipped"
      zs_campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "completed"
        | "failed"
        | "canceled"
      zs_medication_type: "mounjaro" | "ozempic" | "saxenda" | "none" | "other"
      zs_message_direction: "inbound" | "outbound"
      zs_message_type: "text" | "audio" | "image"
      zs_onboarding_step:
        | "welcome"
        | "name"
        | "initial_weight"
        | "target_weight"
        | "medication"
        | "dose"
        | "reminders"
        | "done"
      zs_reminder_type: "dose" | "water" | "weight" | "workout" | "custom"
      zs_subscription_status: "inactive" | "active" | "late" | "canceled"
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
      user_role: ["admin", "vendedora"],
      zs_campaign_send_status: ["pending", "sent", "failed", "skipped"],
      zs_campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "completed",
        "failed",
        "canceled",
      ],
      zs_medication_type: ["mounjaro", "ozempic", "saxenda", "none", "other"],
      zs_message_direction: ["inbound", "outbound"],
      zs_message_type: ["text", "audio", "image"],
      zs_onboarding_step: [
        "welcome",
        "name",
        "initial_weight",
        "target_weight",
        "medication",
        "dose",
        "reminders",
        "done",
      ],
      zs_reminder_type: ["dose", "water", "weight", "workout", "custom"],
      zs_subscription_status: ["inactive", "active", "late", "canceled"],
    },
  },
} as const
