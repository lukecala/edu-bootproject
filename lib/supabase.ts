import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type LeadStatus =
  | 'pending'
  | 'qualified'
  | 'connection_sent'
  | 'accepted'
  | 'message_first_sent'
  | 'disqualified'

export type LeadSource = 'origami' | 'autonomous'

export type Lead = {
  id: string
  full_name: string
  linkedin_url: string
  source: LeadSource
  status: LeadStatus
  score: number | null
  created_at: string
  connected_at: string | null
}

let _browser: SupabaseClient | null = null
export function browserClient(): SupabaseClient {
  if (!_browser) {
    _browser = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _browser
}

export function serverClient(): SupabaseClient {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
