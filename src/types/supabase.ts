// Tipos básicos do Supabase para evitar erros de tipagem
export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: 'trial' | 'paid' | 'master';
          status: 'active' | 'expired' | 'cancelled' | 'pending_payment';
          trial_start_date: string | null;
          trial_end_date: string | null;
          payment_date: string | null;
          payment_amount: number | null;
          payment_intent_id: string | null;
          expires_at: string | null;
          manual_access: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type?: 'trial' | 'paid' | 'master';
          status?: 'active' | 'expired' | 'cancelled' | 'pending_payment';
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          payment_date?: string | null;
          payment_amount?: number | null;
          payment_intent_id?: string | null;
          expires_at?: string | null;
          manual_access?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: 'trial' | 'paid' | 'master';
          status?: 'active' | 'expired' | 'cancelled' | 'pending_payment';
          trial_start_date?: string | null;
          trial_end_date?: string | null;
          payment_date?: string | null;
          payment_amount?: number | null;
          payment_intent_id?: string | null;
          expires_at?: string | null;
          manual_access?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_master: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_master?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_master?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      available_systems: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string;
          color: string;
          image: string;
          url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}