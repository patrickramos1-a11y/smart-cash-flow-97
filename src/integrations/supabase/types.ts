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
      contract_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          minimum_wage_factor: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          minimum_wage_factor: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          minimum_wage_factor?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          active: boolean
          categoria_id: string | null
          centro_custo_id: string | null
          conta_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          dia_vencimento: number
          forma_pagamento_id: string | null
          id: string
          nome: string
          notes: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          active?: boolean
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento: number
          forma_pagamento_id?: string | null
          id?: string
          nome: string
          notes?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          active?: boolean
          categoria_id?: string | null
          centro_custo_id?: string | null
          conta_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento?: number
          forma_pagamento_id?: string | null
          id?: string
          nome?: string
          notes?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      minimum_wage_config: {
        Row: {
          created_at: string
          effective_date: string
          id: string
          notes: string | null
          updated_at: string
          value: number
          year: number
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
          value: number
          year: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: string
          notes?: string | null
          updated_at?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      recurring_clients: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_contracts: {
        Row: {
          active: boolean
          client_id: string
          created_at: string
          custom_minimum_wage_factor: number | null
          end_date: string | null
          id: string
          notes: string | null
          plan_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          client_id: string
          created_at?: string
          custom_minimum_wage_factor?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          client_id?: string
          created_at?: string
          custom_minimum_wage_factor?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          plan_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "recurring_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_contracts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "contract_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_installments: {
        Row: {
          competence_month: number
          competence_year: number
          contract_id: string
          created_at: string
          due_date: string
          expected_value: number
          id: string
          minimum_wage_factor: number
          minimum_wage_value: number
          notes: string | null
          paid_value: number | null
          payment_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          competence_month: number
          competence_year: number
          contract_id: string
          created_at?: string
          due_date: string
          expected_value: number
          id?: string
          minimum_wage_factor: number
          minimum_wage_value: number
          notes?: string | null
          paid_value?: number | null
          payment_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          competence_month?: number
          competence_year?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          expected_value?: number
          id?: string
          minimum_wage_factor?: number
          minimum_wage_value?: number
          notes?: string | null
          paid_value?: number | null
          payment_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "recurring_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_history: {
        Row: {
          created_at: string
          dados_anteriores: Json | null
          evento: Database["public"]["Enums"]["history_evento"]
          id: string
          modulo_origem: string
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dados_anteriores?: Json | null
          evento: Database["public"]["Enums"]["history_evento"]
          id?: string
          modulo_origem: string
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dados_anteriores?: Json | null
          evento?: Database["public"]["Enums"]["history_evento"]
          id?: string
          modulo_origem?: string
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          categoria_id: string | null
          centro_custo_id: string | null
          cliente_id: string | null
          competencia_ano: number
          competencia_mes: number
          conta_id: string | null
          contrato_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          documento_numero: string | null
          documento_tipo: Database["public"]["Enums"]["documento_tipo"] | null
          fixed_expense_id: string | null
          forma_pagamento_id: string | null
          id: string
          installment_id: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"]
          notes: string | null
          origem: Database["public"]["Enums"]["transaction_origem"]
          status: Database["public"]["Enums"]["transaction_status"]
          tipo_movimento: Database["public"]["Enums"]["transaction_tipo_movimento"]
          updated_at: string
          valor: number
          valor_pago: number | null
        }
        Insert: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          competencia_ano: number
          competencia_mes: number
          conta_id?: string | null
          contrato_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          documento_numero?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          fixed_expense_id?: string | null
          forma_pagamento_id?: string | null
          id?: string
          installment_id?: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"]
          notes?: string | null
          origem: Database["public"]["Enums"]["transaction_origem"]
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo_movimento: Database["public"]["Enums"]["transaction_tipo_movimento"]
          updated_at?: string
          valor?: number
          valor_pago?: number | null
        }
        Update: {
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          competencia_ano?: number
          competencia_mes?: number
          conta_id?: string | null
          contrato_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          documento_numero?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          fixed_expense_id?: string | null
          forma_pagamento_id?: string | null
          id?: string
          installment_id?: string | null
          natureza?: Database["public"]["Enums"]["transaction_natureza"]
          notes?: string | null
          origem?: Database["public"]["Enums"]["transaction_origem"]
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo_movimento?: Database["public"]["Enums"]["transaction_tipo_movimento"]
          updated_at?: string
          valor?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_transactions_fixed_expense"
            columns: ["fixed_expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "recurring_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "recurring_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "recurring_installments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      documento_tipo: "NF" | "RECIBO" | "NOTA_DEBITO" | "SEM_DOCUMENTO"
      history_evento: "CRIADO" | "MARCADO_PAGO" | "ESTORNADO" | "ALTERADO"
      transaction_natureza: "RECORRENTE" | "AVULSA"
      transaction_origem:
        | "CONTRATO_RECORRENTE"
        | "DESPESA_FIXA"
        | "LANCAMENTO_MANUAL"
        | "IMPORTACAO"
      transaction_status: "EM_ABERTO" | "PAGO" | "ATRASADO"
      transaction_tipo_movimento: "ENTRADA" | "SAIDA"
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
      documento_tipo: ["NF", "RECIBO", "NOTA_DEBITO", "SEM_DOCUMENTO"],
      history_evento: ["CRIADO", "MARCADO_PAGO", "ESTORNADO", "ALTERADO"],
      transaction_natureza: ["RECORRENTE", "AVULSA"],
      transaction_origem: [
        "CONTRATO_RECORRENTE",
        "DESPESA_FIXA",
        "LANCAMENTO_MANUAL",
        "IMPORTACAO",
      ],
      transaction_status: ["EM_ABERTO", "PAGO", "ATRASADO"],
      transaction_tipo_movimento: ["ENTRADA", "SAIDA"],
    },
  },
} as const
