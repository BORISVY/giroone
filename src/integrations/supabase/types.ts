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
      audit_logs: {
        Row: {
          action: string
          actor_name: string | null
          created_at: string
          entity: string
          entity_id: string | null
          field: string | null
          id: string
          new_value: string | null
          old_value: string | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          field?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      error_events: {
        Row: {
          blocked: boolean
          created_at: string
          details: string | null
          driver_id: string | null
          id: string
          kind: Database["public"]["Enums"]["error_kind"]
          movement_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          blocked?: boolean
          created_at?: string
          details?: string | null
          driver_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["error_kind"]
          movement_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          blocked?: boolean
          created_at?: string
          details?: string | null
          driver_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["error_kind"]
          movement_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_events_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_history: {
        Row: {
          actor_name: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["incident_status"] | null
          id: string
          incident_id: string
          note: string | null
          to_status: Database["public"]["Enums"]["incident_status"] | null
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["incident_status"] | null
          id?: string
          incident_id: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["incident_status"] | null
          id?: string
          incident_id?: string
          note?: string | null
          to_status?: Database["public"]["Enums"]["incident_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_history_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          category: Database["public"]["Enums"]["incident_category"]
          created_at: string
          deleted_at: string | null
          description: string
          driver_id: string | null
          id: string
          km: number | null
          movement_id: string | null
          number: number
          owner_id: string | null
          owner_name: string | null
          resolution_note: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["incident_status"]
          vehicle_id: string
          viewed_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          deleted_at?: string | null
          description: string
          driver_id?: string | null
          id?: string
          km?: number | null
          movement_id?: string | null
          number?: never
          owner_id?: string | null
          owner_name?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          vehicle_id: string
          viewed_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["incident_category"]
          created_at?: string
          deleted_at?: string | null
          description?: string
          driver_id?: string | null
          id?: string
          km?: number | null
          movement_id?: string | null
          number?: never
          owner_id?: string | null
          owner_name?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          vehicle_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          amount: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["maintenance_kind"]
          km: number | null
          notes: string | null
          performed_at: string
          provider_id: string | null
          type_id: string | null
          vehicle_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["maintenance_kind"]
          km?: number | null
          notes?: string | null
          performed_at?: string
          provider_id?: string | null
          type_id?: string | null
          vehicle_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["maintenance_kind"]
          km?: number | null
          notes?: string | null
          performed_at?: string
          provider_id?: string | null
          type_id?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "maintenance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          interval_km: number | null
          interval_months: number | null
          last_date: string | null
          last_km: number | null
          name: string
          vehicle_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          last_date?: string | null
          last_km?: number | null
          name: string
          vehicle_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          interval_km?: number | null
          interval_months?: number | null
          last_date?: string | null
          last_km?: number | null
          name?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_types: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["maintenance_kind"]
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["maintenance_kind"]
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["maintenance_kind"]
          name?: string
        }
        Relationships: []
      }
      movements: {
        Row: {
          corrected: boolean
          correction_count: number
          created_at: string
          deleted_at: string | null
          driver_id: string
          id: string
          km: number
          notes: string | null
          occurred_at: string
          photo_url: string | null
          reason: string | null
          trip_id: string | null
          type: Database["public"]["Enums"]["movement_type"]
          vehicle_id: string
        }
        Insert: {
          corrected?: boolean
          correction_count?: number
          created_at?: string
          deleted_at?: string | null
          driver_id: string
          id?: string
          km: number
          notes?: string | null
          occurred_at?: string
          photo_url?: string | null
          reason?: string | null
          trip_id?: string | null
          type: Database["public"]["Enums"]["movement_type"]
          vehicle_id: string
        }
        Update: {
          corrected?: boolean
          correction_count?: number
          created_at?: string
          deleted_at?: string | null
          driver_id?: string
          id?: string
          km?: number
          notes?: string | null
          occurred_at?: string
          photo_url?: string | null
          reason?: string | null
          trip_id?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          distance_km: number | null
          driver_id: string
          end_km: number | null
          ended_at: string | null
          id: string
          open: boolean
          reason: string | null
          start_km: number
          started_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          driver_id: string
          end_km?: number | null
          ended_at?: string | null
          id?: string
          open?: boolean
          reason?: string | null
          start_km: number
          started_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          driver_id?: string
          end_km?: number | null
          ended_at?: string | null
          id?: string
          open?: boolean
          reason?: string | null
          start_km?: number
          started_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          id: string
          screen: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          id?: string
          screen: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          id?: string
          screen?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          active: boolean
          brand: string
          code: string
          color: string | null
          created_at: string
          current_km: number
          deleted_at: string | null
          id: string
          model: string
          notes: string | null
          plate: string
          status: Database["public"]["Enums"]["vehicle_status"]
          year: number | null
        }
        Insert: {
          active?: boolean
          brand?: string
          code: string
          color?: string | null
          created_at?: string
          current_km?: number
          deleted_at?: string | null
          id?: string
          model?: string
          notes?: string | null
          plate: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          year?: number | null
        }
        Update: {
          active?: boolean
          brand?: string
          code?: string
          color?: string | null
          created_at?: string
          current_km?: number
          deleted_at?: string | null
          id?: string
          model?: string
          notes?: string | null
          plate?: string
          status?: Database["public"]["Enums"]["vehicle_status"]
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      rebuild_trips_from_movements: { Args: never; Returns: number }
      register_movement: {
        Args: {
          p_driver_id: string
          p_km: number
          p_notes?: string
          p_photo_url?: string
          p_reason: string
          p_type: Database["public"]["Enums"]["movement_type"]
          p_vehicle_code: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "operador"
      error_kind:
        | "saida_duplicada"
        | "retorno_sem_saida"
        | "km_invalido"
        | "correcao"
        | "retorno_esquecido"
        | "veiculo_incorreto"
        | "outros"
      incident_category:
        | "pneus"
        | "freios"
        | "motor"
        | "suspensao"
        | "eletrica"
        | "funilaria"
        | "ar_condicionado"
        | "documentacao"
        | "limpeza"
        | "seguranca"
        | "equipamentos"
        | "outros"
      incident_status:
        | "nova"
        | "visualizada"
        | "pendente"
        | "realizada"
        | "recusada"
      maintenance_kind: "preventiva" | "corretiva"
      movement_type: "saida" | "retorno"
      vehicle_status: "disponivel" | "em_uso" | "manutencao" | "inativo"
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
    Enums: {
      app_role: ["admin", "operador"],
      error_kind: [
        "saida_duplicada",
        "retorno_sem_saida",
        "km_invalido",
        "correcao",
        "retorno_esquecido",
        "veiculo_incorreto",
        "outros",
      ],
      incident_category: [
        "pneus",
        "freios",
        "motor",
        "suspensao",
        "eletrica",
        "funilaria",
        "ar_condicionado",
        "documentacao",
        "limpeza",
        "seguranca",
        "equipamentos",
        "outros",
      ],
      incident_status: [
        "nova",
        "visualizada",
        "pendente",
        "realizada",
        "recusada",
      ],
      maintenance_kind: ["preventiva", "corretiva"],
      movement_type: ["saida", "retorno"],
      vehicle_status: ["disponivel", "em_uso", "manutencao", "inativo"],
    },
  },
} as const
