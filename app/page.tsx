import { serverClient, type Icp, type Lead } from '@/lib/supabase'
import { Tracker } from './tracker'
import { IcpOnboarding } from './icp-onboarding'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = serverClient()

  const [leadsRes, icpRes] = await Promise.all([
    supabase
      .from('leads')
      .select('id, linkedin_url, source, status, first_message, last_activity_at, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('icp')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const leads = (leadsRes.data ?? []) as Lead[]
  const icp = (icpRes.data ?? null) as Icp | null
  const error = leadsRes.error

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-serif text-6xl tracking-tight leading-none">
          Pipeline<span className="text-accent italic">.</span>
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {leads.length} leads · live
          {error && <span className="text-danger ml-4">db error: {error.message}</span>}
        </p>
      </header>
      <Tracker initial={leads} icp={icp} />
      {!icp && <IcpOnboarding />}
    </div>
  )
}
