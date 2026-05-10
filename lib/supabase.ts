import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type LeadStatus = 'connection_sent' | 'new' | 'connected' | 'rejected'
export type FirstMessage = 'message_sent' | 'replied'
export type LeadSource = 'origami' | 'monitor_manual'

export type Lead = {
  id: string
  linkedin_url: string
  source: LeadSource
  status: LeadStatus
  first_message: FirstMessage | null
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export type Icp = {
  id: string
  role: string | null
  industry: string | null
  company_size: string | null
  geography: string | null
  signal: string | null
  disqualification: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const LEAD_STATUSES: LeadStatus[] = ['connection_sent', 'new', 'connected', 'rejected']
export const FIRST_MESSAGES: FirstMessage[] = ['message_sent', 'replied']
export const LEAD_SOURCES: LeadSource[] = ['origami', 'monitor_manual']

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
