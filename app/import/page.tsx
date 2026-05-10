import { ImportClient } from './import-client'

export default function ImportPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <h1 className="font-serif text-6xl tracking-tight leading-none">
          Import<span className="text-accent italic">.</span>
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          drop an origami csv · auto-mapped
        </p>
      </header>
      <ImportClient />
    </div>
  )
}
