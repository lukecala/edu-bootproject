'use client'

import { useState, useTransition } from 'react'
import { createIcp, type IcpInput } from './actions'

const FIELDS: Array<{ key: keyof IcpInput; label: string; placeholder: string; multiline?: boolean }> = [
  { key: 'role', label: 'role', placeholder: 'e.g. Head of Growth, B2B SaaS founder' },
  { key: 'industry', label: 'industry', placeholder: 'e.g. fintech, ecommerce, agencies' },
  { key: 'company_size', label: 'company size', placeholder: 'e.g. 10–50, 50–200' },
  { key: 'geography', label: 'geography', placeholder: 'e.g. EU, DACH, US East Coast' },
  { key: 'signal', label: 'signal', placeholder: 'e.g. recently raised seed, hiring AEs' },
  { key: 'notes', label: 'notes', placeholder: 'free-form context, exclusions, anti-fit', multiline: true },
]

const EMPTY: IcpInput = {
  role: '',
  industry: '',
  company_size: '',
  geography: '',
  signal: '',
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
        await createIcp(form)
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
            define who we're hunting · stored once, used everywhere
          </p>
        </div>

        <div className="px-10 py-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {FIELDS.map((f) => (
            <label key={f.key} className="block space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                {f.label}
                {(f.key === 'role' || f.key === 'industry' || f.key === 'geography') && (
                  <span className="text-accent ml-1">*</span>
                )}
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
            {error ? <span className="text-danger">{error}</span> : 'fields with * are required'}
          </p>
          <button
            type="submit"
            disabled={!canSubmit || pending}
            className="font-mono text-xs uppercase tracking-[0.25em] px-6 py-3 border border-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {pending ? 'saving…' : 'save icp'}
          </button>
        </div>
      </form>
    </div>
  )
}
