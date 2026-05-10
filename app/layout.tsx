import type { Metadata } from 'next'
import { Fraunces, Geist, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
})
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-jb',
})

export const metadata: Metadata = {
  title: 'LinkedIn Tracker',
  description: 'Read-only pipeline view for autonomous + Origami lead-gen flows',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable} ${jetbrains.variable} antialiased`}
    >
      <body className="min-h-screen">
        <header className="border-b border-border">
          <nav className="max-w-6xl mx-auto px-8 py-6 flex items-baseline justify-between">
            <Link href="/" className="font-serif text-2xl tracking-tight">
              LinkedIn <span className="italic text-accent">tracker</span>
            </Link>
            <div className="flex gap-8 font-mono text-xs uppercase tracking-[0.2em] text-muted">
              <Link href="/" className="hover:text-foreground transition-colors">
                Pipeline
              </Link>
              <Link href="/import" className="hover:text-foreground transition-colors">
                Import
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-8 py-16">{children}</main>
      </body>
    </html>
  )
}
