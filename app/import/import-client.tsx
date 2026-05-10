'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { importLeads } from './actions'

const URL_RE = [/linkedin/i, /profile[\s_-]?url/i, /^url$/i]

type Row = Record<string, string>

function detect(headers: string[]): string | null {
  return headers.find((h) => URL_RE.some((p) => p.test(h.trim()))) ?? null
}

export function ImportClient() {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [urlField, setUrlField] = useState<string | null>(null)
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
        setUrlField(detect(hs))
      },
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  const ready = !!urlField

  async function submit() {
    setSubmitting(true)
    setResult(null)
    try {
      const payload = rows
        .map((row) => ({ linkedin_url: (urlField ? row[urlField] : '').trim() }))
        .filter((r) => r.linkedin_url)
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
          {isDragActive ? 'rilascia per caricare' : 'trascina un csv qui'}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted mt-4">
          oppure clicca per scegliere · utf-8 · header richiesti · viene importato solo l'url linkedin
        </p>
      </div>

      {headers.length > 0 && (
        <>
          <section className="border-t border-border pt-10 space-y-6">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-3xl">Mappatura</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                rilevata dagli header
              </span>
            </div>
            <Field
              label="url linkedin"
              hint="obbligatorio"
              headers={headers}
              value={urlField}
              onChange={setUrlField}
            />
          </section>

          <section className="border-t border-border pt-10 space-y-6">
            <div className="flex items-baseline gap-3">
              <h2 className="font-serif text-3xl">Anteprima</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                {rows.length} righe · prime 8 mostrate
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 uppercase tracking-[0.25em] text-muted font-normal text-[10px]">
                      url linkedin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-2 text-muted">
                        {(urlField ? row[urlField] : '') || (
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
              {submitting ? 'importazione…' : `importa ${rows.length} lead`}
            </button>
            {!ready && (
              <span className="font-mono text-xs text-muted">
                mappa una colonna url linkedin per continuare
              </span>
            )}
          </div>

          {result && (
            <div className="border-t border-border pt-6 font-mono text-sm">
              {result.error ? (
                <span className="text-danger">errore: {result.error}</span>
              ) : (
                <>
                  <span className="text-success">{result.inserted}</span>
                  <span className="text-muted"> inseriti · </span>
                  <span className="text-muted">{result.skipped}</span>
                  <span className="text-muted"> saltati (duplicati o vuoti)</span>
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
        {label} <span className="opacity-50 normal-case tracking-normal">· {hint}</span>
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="bg-transparent border-b border-border py-2 font-sans text-base focus:outline-none focus:border-accent"
      >
        <option value="">— nessuna —</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  )
}
