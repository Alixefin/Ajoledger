export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MemberStatus = 'active' | 'left'

export interface Database {
  public: {
    Tables: {
      group_settings: {
        Row: {
          id: string
          monthly_contribution: number
          group_name: string
          cycle_start_date: string
          created_at: string
        }
        Insert: {
          id?: string
          monthly_contribution: number
          group_name: string
          cycle_start_date: string
          created_at?: string
        }
        Update: {
          id?: string
          monthly_contribution?: number
          group_name?: string
          cycle_start_date?: string
          created_at?: string
        }
      }
      members: {
        Row: {
          id: string
          full_name: string
          phone: string
          email: string | null
          whatsapp: string | null
          passport_url: string | null
          join_date: string
          status: MemberStatus
          notes: string | null
          rotation_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          phone: string
          email?: string | null
          whatsapp?: string | null
          passport_url?: string | null
          join_date?: string
          status?: MemberStatus
          notes?: string | null
          rotation_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string
          email?: string | null
          whatsapp?: string | null
          passport_url?: string | null
          join_date?: string
          status?: MemberStatus
          notes?: string | null
          rotation_order?: number | null
          created_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          member_id: string
          month_year: string
          amount_paid: number
          expected_amount: number
          paid_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          month_year: string
          amount_paid: number
          expected_amount: number
          paid_at?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          month_year?: string
          amount_paid?: number
          expected_amount?: number
          paid_at?: string
          note?: string | null
          created_at?: string
        }
      }
      payouts: {
        Row: {
          id: string
          member_id: string
          month_year: string
          amount: number
          paid_at: string
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          month_year: string
          amount: number
          paid_at?: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          month_year?: string
          amount?: number
          paid_at?: string
          note?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      member_status: MemberStatus
    }
  }
}

// Helper types
export type GroupSettings = Database['public']['Tables']['group_settings']['Row']
export type Member = Database['public']['Tables']['members']['Row']
export type Contribution = Database['public']['Tables']['contributions']['Row']
export type Payout = Database['public']['Tables']['payouts']['Row']

export type InsertMember = Database['public']['Tables']['members']['Insert']
export type UpdateMember = Database['public']['Tables']['members']['Update']

export type MemberWithContributions = Member & {
  contributions: Contribution[]
  total_paid: number
}

export type PayoutWithMember = Payout & {
  member: { full_name: string } | null
}
