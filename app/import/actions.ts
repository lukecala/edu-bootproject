'use server'

import { revalidatePath } from 'next/cache'
import { serverClient } from '@/lib/supabase'

export async function importLeads(
  rows: { linkedin_url: string }[],
): Promise<{ inserted: number; skipped: number }> {
  const supabase = serverClient()
  const cleaned = rows
    .map((r) => ({
      linkedin_url: r.linkedin_url.trim(),
      source: 'origami' as const,
      status: 'new' as const,
    }))
    .filter((r) => r.linkedin_url)

  if (cleaned.length === 0) {
    return { inserted: 0, skipped: rows.length }
  }

  const { data, error } = await supabase
    .from('leads')
    .upsert(cleaned, { onConflict: 'linkedin_url', ignoreDuplicates: true })
    .select('id')

  if (error) throw new Error(error.message)

  const inserted = data?.length ?? 0
  revalidatePath('/')
  return { inserted, skipped: rows.length - inserted }
}
