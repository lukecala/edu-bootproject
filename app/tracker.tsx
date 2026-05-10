'use client'

import { useEffect, useState } from 'react'
import { browserClient, type Lead, type LeadStatus, type LeadSource } from '@/lib/supabase'

const STATUS_LABELS: Record<LeadStatus, string> = {
  pending: 'pending',
  qualified: 'qualified',
  connection_sent: 'connect sent',
  accepted: 'accepted',
  message_first_sent: 'message sent',
  disqualified: 'disqualified',
}

const STATUS_CLASS: Record<LeadStatus, string> = {
  pending: 'text-muted',
  qualified: 'text-accent',
  connection_sent: 'text-foreground',
  accepted: 'text-success font-medium',
  message_first_sent: 'text-warning',
  disqualified: 'text-danger line-through opacity-60',
}

const STATUSES: LeadStatus[] = [
  'pending',
  'qualified',
  'connection_sent',
  'accepted',
  'message_first_sent',
  'disqualified',
]

type FilterStatus = 'all' | LeadStatus
type FilterSource = 'all' | LeadSource

export function Tracker({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initial)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')

  useEffect(() => {
    const sb = browserClient()
    const ch = sb
      .channel('leads-tracker')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (p) => {
          if (p.eventType === 'INSERT') {
            const incoming = p.new as Lead
            setLeads((prev) => [incoming, ...prev.filter((l) => l.id !== incoming.id)])
          } else if (p.eventType === 'UPDATE') {
            const incoming = p.new as Lead
            setLeads((prev) => prev.map((l) => (l.id === incoming.id ? incoming : l)))
          } else if (p.eventType === 'DELETE') {
            const removed = p.old as Lead
            setLeads((prev) => prev.filter((l) => l.id !== removed.id))
          }
        }
      )
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [])

  const filtered = leads.filter(
    (l) =>
      (filterStatus === 'all' || l.status === filterStatus) &&
      (filterSource === 'all' || l.source === filterSource)
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-8 items-baseline pb-5 border-b border-border">
        <Filter
          label="status"
          value={filterStatus}
          options={[
            ['all', 'all status'],
            ...STATUSES.map((s) => [s, STATUS_LABELS[s]] as [string, string]),
          ]}
          onChange={(v) => setFilterStatus(v as FilterStatus)}
        />
        <Filter
          label="source"
          value={filterSource}
          options={[
            ['all', 'all sources'],
            ['origami', 'origami'],
            ['autonomous', 'autonomous'],
          ]}
          onChange={(v) => setFilterSource(v as FilterSource)}
        />
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted ml-auto">
          {filtered.length} <span className="opacity-50">/ {leads.length}</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['full name', 'linkedin url', 'source', 'status'].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-border/50 hover:bg-surface transition-colors"
              >
                <td className="py-4 pr-4 font-serif text-lg">{lead.full_name}</td>
                <td className="py-4 pr-4 font-mono text-sm">
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted hover:text-accent underline-offset-4 hover:underline"
                  >
                    {lead.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                  </a>
                </td>
                <td className="py-4 pr-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
                  {lead.source}
                </td>
                <td
                  className={`py-4 font-mono text-xs uppercase tracking-[0.2em] ${STATUS_CLASS[lead.status]}`}
                >
                  {STATUS_LABELS[lead.status]}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-16 text-center font-serif italic text-muted text-lg"
                >
                  no leads in this slice yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ReadonlyArray<[string, string]>
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-baseline gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-mono text-xs uppercase tracking-[0.2em] cursor-pointer focus:outline-none border-b border-transparent focus:border-accent py-1"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}
