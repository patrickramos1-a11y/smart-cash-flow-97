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
      account_categories: {
        Row: {
          active: boolean
          color: string | null
          company_id: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          company_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          company_id?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      account_transfers: {
        Row: {
          amount: number
          company_id: string | null
          created_at: string
          from_account_id: string
          id: string
          notes: string | null
          planned_occurrence_id: string | null
          to_account_id: string
          transfer_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          company_id?: string | null
          created_at?: string
          from_account_id: string
          id?: string
          notes?: string | null
          planned_occurrence_id?: string | null
          to_account_id: string
          transfer_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string | null
          created_at?: string
          from_account_id?: string
          id?: string
          notes?: string | null
          planned_occurrence_id?: string | null
          to_account_id?: string
          transfer_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_transfers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_planned_occurrence_id_fkey"
            columns: ["planned_occurrence_id"]
            isOneToOne: false
            referencedRelation: "planned_transfer_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          active: boolean
          bank: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          current_balance: number
          id: string
          initial_balance: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bank?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bank?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          initial_balance?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "account_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_backup_pre_refactor: {
        Row: {
          active: boolean | null
          bank: string | null
          category_id: string | null
          company_id: string | null
          created_at: string | null
          current_balance: number | null
          id: string | null
          initial_balance: number | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          bank?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string | null
          initial_balance?: number | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          bank?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string | null
          initial_balance?: number | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      backlog_attachments: {
        Row: {
          backlog_item_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_attachments_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_history: {
        Row: {
          backlog_item_id: string
          created_at: string
          event_description: string | null
          event_type: Database["public"]["Enums"]["backlog_event_type"]
          id: string
          new_value: string | null
          previous_value: string | null
          user_id: string | null
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          event_description?: string | null
          event_type: Database["public"]["Enums"]["backlog_event_type"]
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_id?: string | null
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          event_description?: string | null
          event_type?: Database["public"]["Enums"]["backlog_event_type"]
          id?: string
          new_value?: string | null
          previous_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backlog_history_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_implementation_records: {
        Row: {
          backlog_item_id: string
          created_at: string
          date: string
          description: string
          id: string
          responsible: string | null
          status: Database["public"]["Enums"]["backlog_implementation_status"]
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          date?: string
          description: string
          id?: string
          responsible?: string | null
          status?: Database["public"]["Enums"]["backlog_implementation_status"]
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          responsible?: string | null
          status?: Database["public"]["Enums"]["backlog_implementation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "backlog_implementation_records_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_item_modules: {
        Row: {
          backlog_item_id: string
          created_at: string
          id: string
          module_id: string
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          id?: string
          module_id: string
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_item_modules_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backlog_item_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "backlog_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_items: {
        Row: {
          category: Database["public"]["Enums"]["backlog_category"]
          completion_date: string | null
          created_at: string
          depends_on_credits: boolean
          description: string | null
          effort_estimate: Database["public"]["Enums"]["backlog_effort"]
          expected_impact: Database["public"]["Enums"]["backlog_impact"]
          id: string
          priority: Database["public"]["Enums"]["backlog_priority"]
          project_id: string
          release_date: string | null
          responsible_product: string | null
          responsible_tech: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["backlog_status"]
          title: string
          updated_at: string
          validation_date: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["backlog_category"]
          completion_date?: string | null
          created_at?: string
          depends_on_credits?: boolean
          description?: string | null
          effort_estimate?: Database["public"]["Enums"]["backlog_effort"]
          expected_impact?: Database["public"]["Enums"]["backlog_impact"]
          id?: string
          priority?: Database["public"]["Enums"]["backlog_priority"]
          project_id: string
          release_date?: string | null
          responsible_product?: string | null
          responsible_tech?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["backlog_status"]
          title: string
          updated_at?: string
          validation_date?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["backlog_category"]
          completion_date?: string | null
          created_at?: string
          depends_on_credits?: boolean
          description?: string | null
          effort_estimate?: Database["public"]["Enums"]["backlog_effort"]
          expected_impact?: Database["public"]["Enums"]["backlog_impact"]
          id?: string
          priority?: Database["public"]["Enums"]["backlog_priority"]
          project_id?: string
          release_date?: string | null
          responsible_product?: string | null
          responsible_tech?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["backlog_status"]
          title?: string
          updated_at?: string
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backlog_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "backlog_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_modules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "backlog_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      backlog_projects: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      backlog_validations: {
        Row: {
          backlog_item_id: string
          created_at: string
          id: string
          notes: string | null
          updated_at: string
          validated: boolean
          validated_by: string | null
          validation_date: string | null
          validation_type:
            | Database["public"]["Enums"]["backlog_validation_type"]
            | null
        }
        Insert: {
          backlog_item_id: string
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          validated?: boolean
          validated_by?: string | null
          validation_date?: string | null
          validation_type?:
            | Database["public"]["Enums"]["backlog_validation_type"]
            | null
        }
        Update: {
          backlog_item_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          updated_at?: string
          validated?: boolean
          validated_by?: string | null
          validation_date?: string | null
          validation_type?:
            | Database["public"]["Enums"]["backlog_validation_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "backlog_validations_backlog_item_id_fkey"
            columns: ["backlog_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_acceptance_events: {
        Row: {
          acceptance_link_id: string | null
          actor_document: string | null
          actor_email: string | null
          actor_name: string | null
          created_at: string
          document_id: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          user_agent: string | null
        }
        Insert: {
          acceptance_link_id?: string | null
          actor_document?: string | null
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          document_id: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Update: {
          acceptance_link_id?: string | null
          actor_document?: string | null
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          document_id?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_acceptance_events_acceptance_link_id_fkey"
            columns: ["acceptance_link_id"]
            isOneToOne: false
            referencedRelation: "contract_acceptance_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_acceptance_events_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_acceptance_links: {
        Row: {
          accepted_at: string | null
          accepted_document: string | null
          accepted_email: string | null
          accepted_ip: string | null
          accepted_name: string | null
          created_at: string
          document_id: string
          expires_at: string | null
          id: string
          status: string
          token: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_document?: string | null
          accepted_email?: string | null
          accepted_ip?: string | null
          accepted_name?: string | null
          created_at?: string
          document_id: string
          expires_at?: string | null
          id?: string
          status?: string
          token: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_document?: string | null
          accepted_email?: string | null
          accepted_ip?: string | null
          accepted_name?: string | null
          created_at?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          status?: string
          token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_acceptance_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clauses: {
        Row: {
          active: boolean
          body: string
          clause_kind: string | null
          created_at: string
          display_order: number
          id: string
          is_required: boolean | null
          notes: string | null
          template_id: string | null
          title: string
          updated_at: string
          version_label: string | null
        }
        Insert: {
          active?: boolean
          body: string
          clause_kind?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean | null
          notes?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          version_label?: string | null
        }
        Update: {
          active?: boolean
          body?: string
          clause_kind?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_required?: boolean | null
          notes?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_clauses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_document_clauses: {
        Row: {
          body: string
          created_at: string
          display_order: number
          document_id: string
          id: string
          source_clause_id: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          display_order?: number
          document_id: string
          id?: string
          source_clause_id?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          display_order?: number
          document_id?: string
          id?: string
          source_clause_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_document_clauses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_document_clauses_source_clause_id_fkey"
            columns: ["source_clause_id"]
            isOneToOne: false
            referencedRelation: "contract_clauses"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          accepted_at: string | null
          contractor_address: string | null
          contractor_document: string
          contractor_email: string | null
          contractor_name: string
          contractor_phone: string | null
          contractor_responsible: string | null
          contractor_type: string
          created_at: string
          created_by: string | null
          digital_snapshot: Json
          end_date: string | null
          id: string
          payment_terms: string | null
          plan_name: string | null
          plan_value: number | null
          start_date: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          contractor_address?: string | null
          contractor_document: string
          contractor_email?: string | null
          contractor_name: string
          contractor_phone?: string | null
          contractor_responsible?: string | null
          contractor_type: string
          created_at?: string
          created_by?: string | null
          digital_snapshot?: Json
          end_date?: string | null
          id?: string
          payment_terms?: string | null
          plan_name?: string | null
          plan_value?: number | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          contractor_address?: string | null
          contractor_document?: string
          contractor_email?: string | null
          contractor_name?: string
          contractor_phone?: string | null
          contractor_responsible?: string | null
          contractor_type?: string
          created_at?: string
          created_by?: string | null
          digital_snapshot?: Json
          end_date?: string | null
          id?: string
          payment_terms?: string | null
          plan_name?: string | null
          plan_value?: number | null
          start_date?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
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
      contract_templates: {
        Row: {
          accent_color: string | null
          active: boolean
          cover_image_url: string | null
          cover_subtitle: string | null
          cover_title: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          service_type: string | null
          template_status: string | null
          updated_at: string
          version_label: string | null
        }
        Insert: {
          accent_color?: string | null
          active?: boolean
          cover_image_url?: string | null
          cover_subtitle?: string | null
          cover_title?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          service_type?: string | null
          template_status?: string | null
          updated_at?: string
          version_label?: string | null
        }
        Update: {
          accent_color?: string | null
          active?: boolean
          cover_image_url?: string | null
          cover_subtitle?: string | null
          cover_title?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          service_type?: string | null
          template_status?: string | null
          updated_at?: string
          version_label?: string | null
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          active: boolean
          code: string | null
          company_id: string | null
          created_at: string
          dre_group: string
          dre_label: string
          dre_order: number
          id: string
          is_expense: boolean
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: string | null
          company_id?: string | null
          created_at?: string
          dre_group: string
          dre_label: string
          dre_order: number
          id?: string
          is_expense?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string | null
          company_id?: string | null
          created_at?: string
          dre_group?: string
          dre_label?: string
          dre_order?: number
          id?: string
          is_expense?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_invoice_items: {
        Row: {
          account_id: string | null
          amount: number
          card_final_digits: string | null
          card_name: string
          card_type: string | null
          category_hint: string | null
          cliente_id: string | null
          conversion_status: string
          converted_at: string | null
          cost_center_id: string | null
          country: string | null
          created_at: string
          description: string
          entity_id: string | null
          fx_rate: number | null
          id: string
          installment: string | null
          invoice_id: string
          normalized_description: string | null
          notes: string | null
          personal_category_id: string | null
          reimbursement_notes: string | null
          reimbursement_status: string
          review_status: string
          scope: string
          transaction_category_id: string | null
          transaction_date: string | null
          transaction_id: string | null
          updated_at: string
          usage_scope: string
          usd_value: number | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_final_digits?: string | null
          card_name: string
          card_type?: string | null
          category_hint?: string | null
          cliente_id?: string | null
          conversion_status?: string
          converted_at?: string | null
          cost_center_id?: string | null
          country?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          fx_rate?: number | null
          id?: string
          installment?: string | null
          invoice_id: string
          normalized_description?: string | null
          notes?: string | null
          personal_category_id?: string | null
          reimbursement_notes?: string | null
          reimbursement_status?: string
          review_status?: string
          scope?: string
          transaction_category_id?: string | null
          transaction_date?: string | null
          transaction_id?: string | null
          updated_at?: string
          usage_scope?: string
          usd_value?: number | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_final_digits?: string | null
          card_name?: string
          card_type?: string | null
          category_hint?: string | null
          cliente_id?: string | null
          conversion_status?: string
          converted_at?: string | null
          cost_center_id?: string | null
          country?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          fx_rate?: number | null
          id?: string
          installment?: string | null
          invoice_id?: string
          normalized_description?: string | null
          notes?: string | null
          personal_category_id?: string | null
          reimbursement_notes?: string | null
          reimbursement_status?: string
          review_status?: string
          scope?: string
          transaction_category_id?: string | null
          transaction_date?: string | null
          transaction_id?: string | null
          updated_at?: string
          usage_scope?: string
          usd_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_invoice_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "recurring_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "financial_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "credit_card_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_personal_category_id_fkey"
            columns: ["personal_category_id"]
            isOneToOne: false
            referencedRelation: "credit_card_personal_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_transaction_category_id_fkey"
            columns: ["transaction_category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_card_invoice_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_invoices: {
        Row: {
          competence_month: number
          competence_year: number
          created_at: string
          created_by: string | null
          file_name: string | null
          holder: string | null
          id: string
          invoice_label: string | null
          selected_cards: Json
          source_meta: Json
          status: string
          total_amount: number
          total_transactions: number
          updated_at: string
        }
        Insert: {
          competence_month: number
          competence_year: number
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          holder?: string | null
          id?: string
          invoice_label?: string | null
          selected_cards?: Json
          source_meta?: Json
          status?: string
          total_amount?: number
          total_transactions?: number
          updated_at?: string
        }
        Update: {
          competence_month?: number
          competence_year?: number
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          holder?: string | null
          id?: string
          invoice_label?: string | null
          selected_cards?: Json
          source_meta?: Json
          status?: string
          total_amount?: number
          total_transactions?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_card_merchant_rules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          merchant_key: string
          merchant_label: string
          transaction_category_id: string
          updated_at: string
          usage_scope: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          merchant_key: string
          merchant_label: string
          transaction_category_id: string
          updated_at?: string
          usage_scope?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          merchant_key?: string
          merchant_label?: string
          transaction_category_id?: string
          updated_at?: string
          usage_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_card_merchant_rules_transaction_category_id_fkey"
            columns: ["transaction_category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_card_personal_categories: {
        Row: {
          active: boolean
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_card_profiles: {
        Row: {
          active: boolean
          card_final_digits: string | null
          card_key: string
          card_name: string
          card_type: string | null
          color: string
          created_at: string
          id: string
          owner_name: string | null
          updated_at: string
          usage_scope: string
        }
        Insert: {
          active?: boolean
          card_final_digits?: string | null
          card_key: string
          card_name: string
          card_type?: string | null
          color?: string
          created_at?: string
          id?: string
          owner_name?: string | null
          updated_at?: string
          usage_scope?: string
        }
        Update: {
          active?: boolean
          card_final_digits?: string | null
          card_key?: string
          card_name?: string
          card_type?: string | null
          color?: string
          created_at?: string
          id?: string
          owner_name?: string | null
          updated_at?: string
          usage_scope?: string
        }
        Relationships: []
      }
      financial_companies: {
        Row: {
          active: boolean
          cnpj: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_entities: {
        Row: {
          active: boolean
          cost_center_id: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cost_center_id?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cost_center_id?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entities_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      fixed_expenses: {
        Row: {
          account_id: string | null
          active: boolean
          cliente_id: string | null
          cost_center_id: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          dia_vencimento: number
          id: string
          nome: string
          notes: string | null
          payment_method_id: string | null
          transaction_category_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          account_id?: string | null
          active?: boolean
          cliente_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento: number
          id?: string
          nome: string
          notes?: string | null
          payment_method_id?: string | null
          transaction_category_id?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          account_id?: string | null
          active?: boolean
          cliente_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          dia_vencimento?: number
          id?: string
          nome?: string
          notes?: string | null
          payment_method_id?: string | null
          transaction_category_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "recurring_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixed_expenses_transaction_category_id_fkey"
            columns: ["transaction_category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses_backup_pre_refactor: {
        Row: {
          active: boolean | null
          categoria_id: string | null
          centro_custo_id: string | null
          cliente_id: string | null
          conta_id: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          dia_vencimento: number | null
          forma_pagamento_id: string | null
          id: string | null
          nome: string | null
          notes: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          active?: boolean | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dia_vencimento?: number | null
          forma_pagamento_id?: string | null
          id?: string | null
          nome?: string | null
          notes?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          active?: boolean | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dia_vencimento?: number | null
          forma_pagamento_id?: string | null
          id?: string | null
          nome?: string | null
          notes?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      migration_conflicts_log: {
        Row: {
          created_at: string
          field_name: string
          id: string
          legacy_value: string | null
          record_id: string
          resolution: string
          table_name: string
          uuid_value: string | null
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          legacy_value?: string | null
          record_id: string
          resolution: string
          table_name: string
          uuid_value?: string | null
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          legacy_value?: string | null
          record_id?: string
          resolution?: string
          table_name?: string
          uuid_value?: string | null
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
      payment_methods: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_transfer_occurrences: {
        Row: {
          created_at: string
          executed_at: string | null
          executed_by: string | null
          executed_transfer_id: string | null
          expected_amount: number
          id: string
          notes: string | null
          planned_transfer_id: string
          scheduled_date: string
          status: Database["public"]["Enums"]["planned_occurrence_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          executed_transfer_id?: string | null
          expected_amount: number
          id?: string
          notes?: string | null
          planned_transfer_id: string
          scheduled_date: string
          status?: Database["public"]["Enums"]["planned_occurrence_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          executed_by?: string | null
          executed_transfer_id?: string | null
          expected_amount?: number
          id?: string
          notes?: string | null
          planned_transfer_id?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["planned_occurrence_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planned_transfer_occurrences_planned_transfer_id_fkey"
            columns: ["planned_transfer_id"]
            isOneToOne: false
            referencedRelation: "planned_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      planned_transfers: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          due_day: number | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["planned_transfer_frequency"]
          from_account_id: string
          id: string
          interval_days: number | null
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["planned_transfer_status"]
          to_account_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_day?: number | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["planned_transfer_frequency"]
          from_account_id: string
          id?: string
          interval_days?: number | null
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["planned_transfer_status"]
          to_account_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_day?: number | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["planned_transfer_frequency"]
          from_account_id?: string
          id?: string
          interval_days?: number | null
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["planned_transfer_status"]
          to_account_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          user_id?: string
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
          dia_vencimento: number
          end_date: string | null
          exigir_emissao_nf: string
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
          dia_vencimento?: number
          end_date?: string | null
          exigir_emissao_nf?: string
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
          dia_vencimento?: number
          end_date?: string | null
          exigir_emissao_nf?: string
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
      recurring_contracts_backup_pre_refactor: {
        Row: {
          active: boolean | null
          client_id: string | null
          created_at: string | null
          custom_minimum_wage_factor: number | null
          dia_vencimento: number | null
          end_date: string | null
          exigir_emissao_nf: string | null
          id: string | null
          notes: string | null
          plan_id: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          custom_minimum_wage_factor?: number | null
          dia_vencimento?: number | null
          end_date?: string | null
          exigir_emissao_nf?: string | null
          id?: string | null
          notes?: string | null
          plan_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          custom_minimum_wage_factor?: number | null
          dia_vencimento?: number | null
          end_date?: string | null
          exigir_emissao_nf?: string | null
          id?: string | null
          notes?: string | null
          plan_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      recurring_installments_backup_pre_refactor: {
        Row: {
          competence_month: number | null
          competence_year: number | null
          contract_id: string | null
          created_at: string | null
          due_date: string | null
          expected_value: number | null
          id: string | null
          minimum_wage_factor: number | null
          minimum_wage_value: number | null
          notes: string | null
          paid_value: number | null
          payment_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          competence_month?: number | null
          competence_year?: number | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          expected_value?: number | null
          id?: string | null
          minimum_wage_factor?: number | null
          minimum_wage_value?: number | null
          notes?: string | null
          paid_value?: number | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          competence_month?: number | null
          competence_year?: number | null
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          expected_value?: number | null
          id?: string | null
          minimum_wage_factor?: number | null
          minimum_wage_value?: number | null
          notes?: string | null
          paid_value?: number | null
          payment_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rejected_transactions: {
        Row: {
          account_id: string | null
          cliente_id: string | null
          competencia_ano: number
          competencia_mes: number
          contrato_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          data_vencimento: string
          descricao: string | null
          documento_numero: string | null
          documento_tipo: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id: string | null
          fixed_expense_id: string | null
          full_payload: Json
          id: string
          installment_id: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"]
          notes: string | null
          origem: Database["public"]["Enums"]["transaction_origem"]
          original_created_at: string | null
          original_transaction_id: string
          rejected_at: string
          rejected_by: string | null
          rejection_reason: string
          responsavel_id: string | null
          tipo_movimento: Database["public"]["Enums"]["transaction_tipo_movimento"]
          transaction_category_id: string | null
          valor: number
        }
        Insert: {
          account_id?: string | null
          cliente_id?: string | null
          competencia_ano: number
          competencia_mes: number
          contrato_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          data_vencimento: string
          descricao?: string | null
          documento_numero?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id?: string | null
          fixed_expense_id?: string | null
          full_payload: Json
          id?: string
          installment_id?: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"]
          notes?: string | null
          origem: Database["public"]["Enums"]["transaction_origem"]
          original_created_at?: string | null
          original_transaction_id: string
          rejected_at?: string
          rejected_by?: string | null
          rejection_reason: string
          responsavel_id?: string | null
          tipo_movimento: Database["public"]["Enums"]["transaction_tipo_movimento"]
          transaction_category_id?: string | null
          valor: number
        }
        Update: {
          account_id?: string | null
          cliente_id?: string | null
          competencia_ano?: number
          competencia_mes?: number
          contrato_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          data_vencimento?: string
          descricao?: string | null
          documento_numero?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id?: string | null
          fixed_expense_id?: string | null
          full_payload?: Json
          id?: string
          installment_id?: string | null
          natureza?: Database["public"]["Enums"]["transaction_natureza"]
          notes?: string | null
          origem?: Database["public"]["Enums"]["transaction_origem"]
          original_created_at?: string | null
          original_transaction_id?: string
          rejected_at?: string
          rejected_by?: string | null
          rejection_reason?: string
          responsavel_id?: string | null
          tipo_movimento?: Database["public"]["Enums"]["transaction_tipo_movimento"]
          transaction_category_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          active: boolean
          color: string | null
          company_id: string | null
          cost_center_id: string
          created_at: string
          default_account_id: string | null
          expense_type:
            | Database["public"]["Enums"]["expense_category_type"]
            | null
          id: string
          name: string
          subtype: string | null
          type: Database["public"]["Enums"]["transaction_tipo_movimento"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          company_id?: string | null
          cost_center_id: string
          created_at?: string
          default_account_id?: string | null
          expense_type?:
            | Database["public"]["Enums"]["expense_category_type"]
            | null
          id?: string
          name: string
          subtype?: string | null
          type: Database["public"]["Enums"]["transaction_tipo_movimento"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          company_id?: string | null
          cost_center_id?: string
          created_at?: string
          default_account_id?: string | null
          expense_type?:
            | Database["public"]["Enums"]["expense_category_type"]
            | null
          id?: string
          name?: string
          subtype?: string | null
          type?: Database["public"]["Enums"]["transaction_tipo_movimento"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_categories_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_entities: {
        Row: {
          created_at: string
          entity_id: string
          fixed_expense_id: string | null
          id: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          fixed_expense_id?: string | null
          id?: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          fixed_expense_id?: string | null
          id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_entities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "financial_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_entities_fixed_expense_id_fkey"
            columns: ["fixed_expense_id"]
            isOneToOne: false
            referencedRelation: "fixed_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_entities_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
          account_id: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          cliente_id: string | null
          company_id: string | null
          competencia_ano: number
          competencia_mes: number
          contrato_id: string | null
          cost_center_id: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string | null
          documento_numero: string | null
          documento_recebimento: string | null
          documento_tipo: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id: string | null
          fixed_expense_id: string | null
          id: string
          installment_id: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"]
          nf_percentual_aplicado: number | null
          notes: string | null
          origem: Database["public"]["Enums"]["transaction_origem"]
          origem_receita: string | null
          planned_transfer_occurrence_id: string | null
          rejection_reason: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          tipo_movimento: Database["public"]["Enums"]["transaction_tipo_movimento"]
          transaction_category_id: string | null
          updated_at: string
          valor: number
          valor_imposto_nf: number | null
          valor_liquido_nf: number | null
          valor_pago: number | null
        }
        Insert: {
          account_id?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          cliente_id?: string | null
          company_id?: string | null
          competencia_ano: number
          competencia_mes: number
          contrato_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao?: string | null
          documento_numero?: string | null
          documento_recebimento?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id?: string | null
          fixed_expense_id?: string | null
          id?: string
          installment_id?: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"]
          nf_percentual_aplicado?: number | null
          notes?: string | null
          origem: Database["public"]["Enums"]["transaction_origem"]
          origem_receita?: string | null
          planned_transfer_occurrence_id?: string | null
          rejection_reason?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo_movimento: Database["public"]["Enums"]["transaction_tipo_movimento"]
          transaction_category_id?: string | null
          updated_at?: string
          valor?: number
          valor_imposto_nf?: number | null
          valor_liquido_nf?: number | null
          valor_pago?: number | null
        }
        Update: {
          account_id?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          cliente_id?: string | null
          company_id?: string | null
          competencia_ano?: number
          competencia_mes?: number
          contrato_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string | null
          documento_numero?: string | null
          documento_recebimento?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id?: string | null
          fixed_expense_id?: string | null
          id?: string
          installment_id?: string | null
          natureza?: Database["public"]["Enums"]["transaction_natureza"]
          nf_percentual_aplicado?: number | null
          notes?: string | null
          origem?: Database["public"]["Enums"]["transaction_origem"]
          origem_receita?: string | null
          planned_transfer_occurrence_id?: string | null
          rejection_reason?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          tipo_movimento?: Database["public"]["Enums"]["transaction_tipo_movimento"]
          transaction_category_id?: string | null
          updated_at?: string
          valor?: number
          valor_imposto_nf?: number | null
          valor_liquido_nf?: number | null
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
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "financial_companies"
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
            foreignKeyName: "transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "financial_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "recurring_installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_planned_transfer_occurrence_id_fkey"
            columns: ["planned_transfer_occurrence_id"]
            isOneToOne: false
            referencedRelation: "planned_transfer_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "financial_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transaction_category_id_fkey"
            columns: ["transaction_category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_backup_pre_refactor: {
        Row: {
          account_id: string | null
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          categoria_id: string | null
          centro_custo_id: string | null
          cliente_id: string | null
          company_id: string | null
          competencia_ano: number | null
          competencia_mes: number | null
          conta_id: string | null
          contrato_id: string | null
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          descricao: string | null
          documento_numero: string | null
          documento_recebimento: string | null
          documento_tipo: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id: string | null
          fixed_expense_id: string | null
          forma_pagamento_id: string | null
          id: string | null
          installment_id: string | null
          natureza: Database["public"]["Enums"]["transaction_natureza"] | null
          nf_percentual_aplicado: number | null
          notes: string | null
          origem: Database["public"]["Enums"]["transaction_origem"] | null
          origem_receita: string | null
          rejection_reason: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          tipo_movimento:
            | Database["public"]["Enums"]["transaction_tipo_movimento"]
            | null
          transaction_category_id: string | null
          updated_at: string | null
          valor: number | null
          valor_imposto_nf: number | null
          valor_liquido_nf: number | null
          valor_pago: number | null
        }
        Insert: {
          account_id?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          company_id?: string | null
          competencia_ano?: number | null
          competencia_mes?: number | null
          conta_id?: string | null
          contrato_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          documento_numero?: string | null
          documento_recebimento?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id?: string | null
          fixed_expense_id?: string | null
          forma_pagamento_id?: string | null
          id?: string | null
          installment_id?: string | null
          natureza?: Database["public"]["Enums"]["transaction_natureza"] | null
          nf_percentual_aplicado?: number | null
          notes?: string | null
          origem?: Database["public"]["Enums"]["transaction_origem"] | null
          origem_receita?: string | null
          rejection_reason?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tipo_movimento?:
            | Database["public"]["Enums"]["transaction_tipo_movimento"]
            | null
          transaction_category_id?: string | null
          updated_at?: string | null
          valor?: number | null
          valor_imposto_nf?: number | null
          valor_liquido_nf?: number | null
          valor_pago?: number | null
        }
        Update: {
          account_id?: string | null
          approval_status?:
            | Database["public"]["Enums"]["approval_status"]
            | null
          approved_at?: string | null
          approved_by?: string | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          cliente_id?: string | null
          company_id?: string | null
          competencia_ano?: number | null
          competencia_mes?: number | null
          conta_id?: string | null
          contrato_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          documento_numero?: string | null
          documento_recebimento?: string | null
          documento_tipo?: Database["public"]["Enums"]["documento_tipo"] | null
          entity_id?: string | null
          fixed_expense_id?: string | null
          forma_pagamento_id?: string | null
          id?: string | null
          installment_id?: string | null
          natureza?: Database["public"]["Enums"]["transaction_natureza"] | null
          nf_percentual_aplicado?: number | null
          notes?: string | null
          origem?: Database["public"]["Enums"]["transaction_origem"] | null
          origem_receita?: string | null
          rejection_reason?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tipo_movimento?:
            | Database["public"]["Enums"]["transaction_tipo_movimento"]
            | null
          transaction_category_id?: string | null
          updated_at?: string | null
          valor?: number | null
          valor_imposto_nf?: number | null
          valor_liquido_nf?: number | null
          valor_pago?: number | null
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          allowed: boolean
          created_at: string
          id: string
          module_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string
          id?: string
          module_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string
          id?: string
          module_key?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_and_delete_rejected: {
        Args: { p_ids: string[]; p_reason: string; p_rejected_by: string }
        Returns: number
      }
      bulk_quitar_periodo: {
        Args: {
          p_month_from: number
          p_month_to: number
          p_year_from: number
          p_year_to: number
        }
        Returns: number
      }
      execute_planned_occurrence: {
        Args: {
          p_amount?: number
          p_occurrence_id: string
          p_real_date?: string
          p_user?: string
        }
        Returns: string
      }
      generate_planned_transfer_occurrences: {
        Args: { p_planned_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_account_balance: {
        Args: { p_account_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "financeiro"
      approval_status: "pendente" | "aprovado" | "rejeitado"
      backlog_category:
        | "NOVA_FUNCIONALIDADE"
        | "MELHORIA_EXISTENTE"
        | "CORRECAO_BUG"
        | "AJUSTE_TECNICO"
        | "UX_UI_VISUAL"
        | "RELATORIOS_INDICADORES"
        | "SEGURANCA_PERMISSOES"
        | "INFRAESTRUTURA_CREDITOS"
      backlog_effort: "PEQUENO" | "MEDIO" | "GRANDE"
      backlog_event_type:
        | "CRIADO"
        | "STATUS_ALTERADO"
        | "ANEXO_ADICIONADO"
        | "ANEXO_REMOVIDO"
        | "PRIORIDADE_ALTERADA"
        | "DATA_ALTERADA"
        | "IMPLEMENTADO"
        | "LANCADO"
        | "VALIDADO"
        | "ARQUIVADO"
      backlog_impact: "ALTO" | "MEDIO" | "BAIXO"
      backlog_implementation_status: "EXECUTADO" | "NAO_EXECUTADO"
      backlog_priority: "ALTA" | "MEDIA" | "BAIXA"
      backlog_status:
        | "IDEIA"
        | "EM_ANALISE"
        | "REFINADO"
        | "AGUARDANDO_RECURSOS"
        | "EM_IMPLEMENTACAO"
        | "EM_TESTES"
        | "IMPLEMENTADO"
        | "LANCADO"
        | "VALIDADO"
        | "ARQUIVADO"
      backlog_validation_type:
        | "TESTE_FUNCIONAL"
        | "VALIDACAO_VISUAL"
        | "VALIDACAO_TECNICA"
        | "VALIDACAO_REGRA_NEGOCIO"
      documento_tipo: "NF" | "RECIBO" | "NOTA_DEBITO" | "SEM_DOCUMENTO"
      expense_category_type: "FIXA" | "VARIAVEL" | "IMPOSTO"
      history_evento: "CRIADO" | "MARCADO_PAGO" | "ESTORNADO" | "ALTERADO"
      planned_occurrence_status:
        | "PLANEJADA"
        | "EXECUTADA"
        | "ATRASADA"
        | "CANCELADA"
      planned_transfer_frequency:
        | "AVULSA"
        | "SEMANAL"
        | "QUINZENAL"
        | "MENSAL"
        | "TRIMESTRAL"
        | "ANUAL"
        | "CUSTOM"
      planned_transfer_status: "ATIVO" | "PAUSADO" | "ENCERRADO"
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
      app_role: ["admin", "financeiro"],
      approval_status: ["pendente", "aprovado", "rejeitado"],
      backlog_category: [
        "NOVA_FUNCIONALIDADE",
        "MELHORIA_EXISTENTE",
        "CORRECAO_BUG",
        "AJUSTE_TECNICO",
        "UX_UI_VISUAL",
        "RELATORIOS_INDICADORES",
        "SEGURANCA_PERMISSOES",
        "INFRAESTRUTURA_CREDITOS",
      ],
      backlog_effort: ["PEQUENO", "MEDIO", "GRANDE"],
      backlog_event_type: [
        "CRIADO",
        "STATUS_ALTERADO",
        "ANEXO_ADICIONADO",
        "ANEXO_REMOVIDO",
        "PRIORIDADE_ALTERADA",
        "DATA_ALTERADA",
        "IMPLEMENTADO",
        "LANCADO",
        "VALIDADO",
        "ARQUIVADO",
      ],
      backlog_impact: ["ALTO", "MEDIO", "BAIXO"],
      backlog_implementation_status: ["EXECUTADO", "NAO_EXECUTADO"],
      backlog_priority: ["ALTA", "MEDIA", "BAIXA"],
      backlog_status: [
        "IDEIA",
        "EM_ANALISE",
        "REFINADO",
        "AGUARDANDO_RECURSOS",
        "EM_IMPLEMENTACAO",
        "EM_TESTES",
        "IMPLEMENTADO",
        "LANCADO",
        "VALIDADO",
        "ARQUIVADO",
      ],
      backlog_validation_type: [
        "TESTE_FUNCIONAL",
        "VALIDACAO_VISUAL",
        "VALIDACAO_TECNICA",
        "VALIDACAO_REGRA_NEGOCIO",
      ],
      documento_tipo: ["NF", "RECIBO", "NOTA_DEBITO", "SEM_DOCUMENTO"],
      expense_category_type: ["FIXA", "VARIAVEL", "IMPOSTO"],
      history_evento: ["CRIADO", "MARCADO_PAGO", "ESTORNADO", "ALTERADO"],
      planned_occurrence_status: [
        "PLANEJADA",
        "EXECUTADA",
        "ATRASADA",
        "CANCELADA",
      ],
      planned_transfer_frequency: [
        "AVULSA",
        "SEMANAL",
        "QUINZENAL",
        "MENSAL",
        "TRIMESTRAL",
        "ANUAL",
        "CUSTOM",
      ],
      planned_transfer_status: ["ATIVO", "PAUSADO", "ENCERRADO"],
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
