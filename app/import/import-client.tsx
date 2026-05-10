'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { importLeads } from './actions'

const NAME_RE = [/^full[\s_-]?name$/i, /^name$/i, /^contact[\s_-]?name$/i]
const URL_RE = [/linkedin/i, /profile[\s_-]?url/i, /^url$/i]
const FIRST_RE = [/^first[\s_-]?name$/i, /^fname$/i, /^given[\s_-]?name$/i]
const LAST_RE = [/^last[\s_-]?name$/i, /^surname$/i, /^lname$/i, /^family[\s_-]?name$/i]

type Mapping = {
  fullName: string | null
  firstName: string | null
  lastName: string | null
  linkedinUrl: string | null
}

type Row = Record<string, string>

function detect(headers: string[]): Mapping {
  const find = (patterns: RegExp[]) =>
    headers.find((h) => patterns.some((p) => p.test(h.trim()))) ?? null
  return {
    fullName: find(NAME_RE),
    firstName: find(FIRST_RE),
    lastName: find(LAST_RE),
    linkedinUrl: find(URL_RE),
  }
}

export function ImportClient() {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [mapping, setMapping] = useState<Mapping>({
    fullName: null,
    firstName: null,
    lastName: null,
    linkedinUrl: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<
    { inserted: number; skipped: number; error?: string } | null
  >(null)

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    setResult(null)
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        const hs = (parsed.meta.fields ?? []).filter(Boolean)
        setHeaders(hs)
        setRows(parsed.data)
        setMapping(detect(hs))
      },
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const ready =
    !!mapping.linkedinUrl &&
    (!!mapping.fullName || (!!mapping.firstName && !!mapping.lastName))

  function buildName(row: Row): string {
    if (mapping.fullName) return (row[mapping.fullName] ?? '').trim()
    const f = mapping.firstName ? row[mapping.firstName] ?? '' : ''
    const l = mapping.lastName ? row[mapping.lastName] ?? '' : ''
    return `${f} ${l}`.trim()
  }

  async function submit() {
    setSubmitting(true)
    setResult(null)
    try {
      const payload = rows
        .map((row) => ({
          full_name: buildName(row),
          linkedin_url: (mapping.linkedinUrl ? row[mapping.linkedinUrl] : '').trim(),
        }))
        .filter((r) => r.full_name && r.linkedin_url)
      const r = await importLeads(payload)
      setResult(r)
    } catch (e) {
      setResult({ inserted: 0, skipped: 0, error: (e as Error).message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-12">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed transition-colors px-12 py-20 text-center cursor-pointer ${
          isDragActive ? 'border-accent bg-surface' : 'border-border hover:border-muted'
        }`}
      >
        <input {...getInputProps()} />
        <p className="font-serif text-3xl">
          {isDragActive ? 'release to drop' : 'drop a csv here'}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mt-4">
          or click to choose · utf-8 · headers required
        </p>
      </div>

      {headers.length > 0 && (
        <>
          <section className="border-t border-border pt-10 space-y-6">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-3xl">Mapping</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                detected from headers
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <Field
                label="full name"
                hint="if present, used as-is"
                headers={headers}
                value={mapping.fullName}
                onChange={(v) => setMapping({ ...mapping, fullName: v })}
              />
              <Field
                label="linkedin url"
                hint="required"
                headers={headers}
                value={mapping.linkedinUrl}
                onChange={(v) => setMapping({ ...mapping, linkedinUrl: v })}
              />
              <Field
                label="first name"
                hint="fallback if no full name"
                headers={headers}
                value={mapping.firstName}
                onChange={(v) => setMapping({ ...mapping, firstName: v })}
              />
              <Field
                label="last name"
                hint="fallback if no full name"
                headers={headers}
                value={mapping.lastName}
                onChange={(v) => setMapping({ ...mapping, lastName: v })}
              />
            </div>
          </section>

          <section className="border-t border-border pt-10 space-y-6">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-3xl">Preview</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                {rows.length} rows · first 8 shown
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 uppercase tracking-[0.25em] text-muted font-normal text-[10px]">
                      full name
                    </th>
                    <th className="text-left py-2 uppercase tracking-[0.25em] text-muted font-normal text-[10px]">
                      linkedin url
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-2 pr-4">
                        {buildName(row) || <span className="text-danger">—</span>}
                      </td>
                      <td className="py-2 text-muted">
                        {(mapping.linkedinUrl ? row[mapping.linkedinUrl] : '') || (
                          <span className="text-danger">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex items-center gap-6 pt-4">
            <button
              disabled={!ready || submitting}
              onClick={submit}
              className="font-mono text-xs uppercase tracking-[0.25em] px-8 py-4 bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent transition-colors"
            >
              {submitting ? 'importing…' : `import ${rows.length} leads`}
            </button>
            {!ready && (
              <span className="font-mono text-xs text-muted">
                map LinkedIn URL + name to continue
              </span>
            )}
          </div>

          {result && (
            <div className="border-t border-border pt-6 font-mono text-sm">
              {result.error ? (
                <span className="text-danger">error: {result.error}</span>
              ) : (
                <>
                  <span className="text-success">{result.inserted}</span>
                  <span className="text-muted"> inserted · </span>
                  <span className="text-muted">{result.skipped}</span>
                  <span className="text-muted"> skipped (duplicates or empty)</span>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Field({
  label,
  hint,
  headers,
  value,
  onChange,
}: {
  label: string
  hint: string
  headers: string[]
  value: string | null
  onChange: (v: string | null) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
        {label}{' '}
        <span className="opacity-50 normal-case tracking-normal">· {hint}</span>
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="bg-transparent border-b border-border py-2 font-sans text-base focus:outline-none focus:border-accent"
      >
        <option value="">— none —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  )
}
