'use client'

import { useState, useTransition } from 'react'
import { createIcp, type IcpInput } from './actions'

const FIELDS: Array<{
  key: keyof IcpInput
  label: string
  placeholder: string
  multiline?: boolean
  required?: boolean
}> = [
  { key: 'role', label: 'ruolo', placeholder: 'es. Head of Growth, founder B2B SaaS', required: true },
  { key: 'industry', label: 'settore', placeholder: 'es. fintech, ecommerce, agenzie', required: true },
  { key: 'company_size', label: 'dimensione azienda', placeholder: 'es. 10–50, 50–200' },
  { key: 'geography', label: 'geografia', placeholder: 'es. EU, DACH, Nord America', required: true },
  { key: 'signal', label: 'segnale', placeholder: 'es. ha appena raccolto seed, sta assumendo AE' },
  {
    key: 'disqualification',
    label: 'criteri di disqualifica',
    placeholder: 'es. agenzie generaliste, freelancer solo, profili senza foto…',
    multiline: true,
  },
  { key: 'notes', label: 'note', placeholder: 'contesto libero, esclusioni, anti-fit', multiline: true },
]

const EMPTY: IcpInput = {
  role: '',
  industry: '',
  company_size: '',
  geography: '',
  signal: '',
  disqualification: '',
  notes: '',
}

export function IcpOnboarding() {
  const [form, setForm] = useState<IcpInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canSubmit = form.role.trim() && form.industry.trim() && form.geography.trim()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await createIcp(form)
        if (!res.ok) setError(res.error)
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl bg-background border border-border shadow-2xl"
      >
        <div className="px-10 pt-10 pb-6 border-b border-border space-y-2">
          <h2 className="font-serif text-4xl tracking-tight">
            ICP<span className="text-accent italic">.</span>
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            definisci chi stiamo cacciando · salvato una volta, usato ovunque
          </p>
        </div>

        <div className="px-10 py-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {FIELDS.map((f) => (
            <label key={f.key} className="block space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                {f.label}
                {f.required && <span className="text-accent ml-1">*</span>}
              </span>
              {f.multiline ? (
                <textarea
                  rows={3}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent border-b border-border focus:border-accent py-2 font-serif text-base focus:outline-none resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent border-b border-border focus:border-accent py-2 font-serif text-base focus:outline-none"
                />
              )}
            </label>
          ))}
        </div>

        <div className="px-10 py-6 border-t border-border flex items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
            {error ? <span className="text-danger">{error}</span> : 'i campi con * sono obbligatori'}
          </p>
          <button
            type="submit"
            disabled={!canSubmit || pending}
            className="font-mono text-xs uppercase tracking-[0.25em] px-6 py-3 border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {pending ? 'salvataggio…' : 'salva icp'}
          </button>
        </div>
      </form>
    </div>
  )
}
