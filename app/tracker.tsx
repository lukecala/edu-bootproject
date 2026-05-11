'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  browserClient,
  FIRST_MESSAGES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type FirstMessage,
  type Icp,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from '@/lib/supabase'
import { updateLeadFirstMessage, updateLeadStatus } from './actions'

const STATUS_LABELS: Record<LeadStatus, string> = {
  connection_sent: 'richiesta inviata',
  new: 'nuovo',
  connected: 'connesso',
  rejected: 'rifiutato',
}

const STATUS_CLASS: Record<LeadStatus, string> = {
  new: 'text-foreground',
  connection_sent: 'text-muted',
  connected: 'text-success',
  rejected: 'text-danger line-through opacity-60',
}

const FIRST_MSG_LABELS: Record<FirstMessage, string> = {
  message_sent: 'messaggio inviato',
  replied: 'ha risposto',
}

const FIRST_MSG_CLASS: Record<FirstMessage, string> = {
  message_sent: 'text-warning',
  replied: 'text-success',
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  origami: 'origami',
  monitor_manual: 'monitor manuale',
}

type FilterStatus = 'all' | LeadStatus
type FilterSource = 'all' | LeadSource

export function Tracker({ initial, icp }: { initial: Lead[]; icp: Icp | null }) {
  const [leads, setLeads] = useState<Lead[]>(initial)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')

  useEffect(() => {
    const sb = browserClient()
    const ch = sb
      .channel('leads-tracker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (p) => {
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
      })
      .subscribe()
    return () => {
      sb.removeChannel(ch)
    }
  }, [])

  const filtered = leads.filter(
    (l) =>
      (filterStatus === 'all' || l.status === filterStatus) &&
      (filterSource === 'all' || l.source === filterSource),
  )

  return (
    <div className="space-y-8">
      {icp && <IcpCallout icp={icp} />}

      <div className="flex flex-wrap gap-8 items-baseline pb-5 border-b border-border">
        <Filter
          label="stato"
          value={filterStatus}
          options={[
            ['all', 'tutti gli stati'],
            ...LEAD_STATUSES.map((s) => [s, STATUS_LABELS[s]] as [string, string]),
          ]}
          onChange={(v) => setFilterStatus(v as FilterStatus)}
        />
        <Filter
          label="sorgente"
          value={filterSource}
          options={[
            ['all', 'tutte le sorgenti'],
            ...LEAD_SOURCES.map((s) => [s, SOURCE_LABELS[s]] as [string, string]),
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
              {['url profilo', 'sorgente', 'stato', '1° messaggio', 'ultima attività'].map((h) => (
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
              <Row key={lead.id} lead={lead} />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-16 text-center font-serif italic text-muted text-lg"
                >
                  nessun lead in questa selezione.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition()

  const handle = lead.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '').replace(/\/$/, '')

  function onStatus(v: LeadStatus) {
    startTransition(async () => {
      const r = await updateLeadStatus(lead.id, v)
      if (!r.ok) alert(r.error)
    })
  }

  function onFirstMessage(v: string) {
    const next = v === '' ? null : (v as FirstMessage)
    startTransition(async () => {
      const r = await updateLeadFirstMessage(lead.id, next)
      if (!r.ok) alert(r.error)
    })
  }

  return (
    <tr
      className={`border-b border-border/50 hover:bg-surface transition-colors ${
        pending ? 'opacity-50' : ''
      }`}
    >
      <td className="py-4 pr-4 font-mono text-sm">
        <a
          href={lead.linkedin_url}
          target="_blank"
          rel="noreferrer"
          className="text-foreground hover:text-accent underline-offset-4 hover:underline"
        >
          {handle}
        </a>
      </td>
      <td className="py-4 pr-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {SOURCE_LABELS[lead.source]}
      </td>
      <td className={`py-4 pr-4 font-mono text-xs uppercase tracking-[0.2em] ${STATUS_CLASS[lead.status]}`}>
        <select
          value={lead.status}
          disabled={pending}
          onChange={(e) => onStatus(e.target.value as LeadStatus)}
          className="bg-transparent font-mono text-xs uppercase tracking-[0.2em] cursor-pointer focus:outline-none border-b border-transparent focus:border-accent py-0.5"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </td>
      <td
        className={`py-4 pr-4 font-mono text-xs uppercase tracking-[0.2em] ${
          lead.first_message ? FIRST_MSG_CLASS[lead.first_message] : 'text-muted'
        }`}
      >
        <select
          value={lead.first_message ?? ''}
          disabled={pending}
          onChange={(e) => onFirstMessage(e.target.value)}
          className="bg-transparent font-mono text-xs uppercase tracking-[0.2em] cursor-pointer focus:outline-none border-b border-transparent focus:border-accent py-0.5"
        >
          <option value="">—</option>
          {FIRST_MESSAGES.map((m) => (
            <option key={m} value={m}>
              {FIRST_MSG_LABELS[m]}
            </option>
          ))}
        </select>
      </td>
      <td className="py-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {lead.last_activity_at ? formatDate(lead.last_activity_at) : '—'}
      </td>
    </tr>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
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
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{label}</span>
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

function IcpCallout({ icp }: { icp: Icp }) {
  const fields: Array<[string, string | null]> = [
    ['ruolo', icp.role],
    ['settore', icp.industry],
    ['dimensione', icp.company_size],
    ['geografia', icp.geography],
    ['segnale', icp.signal],
  ]
  return (
    <aside className="border border-border bg-surface/50 px-6 py-5 space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">icp</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
          chi stiamo cacciando
        </span>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-2">
        {fields.map(([k, v]) => (
          <div key={k} className="space-y-1">
            <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">{k}</dt>
            <dd className="font-serif text-base">{v || <span className="text-muted italic">—</span>}</dd>
          </div>
        ))}
      </dl>
      {icp.disqualification && (
        <div className="pt-3 border-t border-border/50 space-y-1">
          <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-danger">
            criteri di disqualifica
          </dt>
          <dd className="font-serif text-sm">{icp.disqualification}</dd>
        </div>
      )}
      {icp.notes && (
        <p className="font-serif text-sm text-muted italic pt-2 border-t border-border/50">
          {icp.notes}
        </p>
      )}
    </aside>
  )
}
