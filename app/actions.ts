'use server'

import { revalidatePath } from 'next/cache'
import { serverClient, type FirstMessage, type LeadStatus } from '@/lib/supabase'

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<ActionResult> {
  try {
    const sb = serverClient()
    const { error } = await sb.from('leads').update({ status }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function updateLeadFirstMessage(
  id: string,
  value: FirstMessage | null,
): Promise<ActionResult> {
  try {
    const sb = serverClient()
    const { error } = await sb.from('leads').update({ first_message: value }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export type IcpInput = {
  role: string
  industry: string
  company_size: string
  geography: string
  signal: string
  disqualification: string
  notes: string
}

function normalize(input: IcpInput): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
  )
}

export async function createIcp(input: IcpInput): Promise<ActionResult> {
  try {
    const sb = serverClient()

    const { count, error: countError } = await sb
      .from('icp')
      .select('id', { count: 'exact', head: true })
    if (countError) return { ok: false, error: `count: ${countError.message}` }
    if ((count ?? 0) > 0) return { ok: false, error: 'ICP già esistente' }

    const payload = normalize(input)
    let { error } = await sb.from('icp').insert(payload)

    // schema may not yet have the `disqualification` column — retry without it
    if (
      error &&
      /disqualification/i.test(error.message) &&
      /column|does not exist|schema cache/i.test(error.message)
    ) {
      const { disqualification: _omit, ...rest } = payload
      void _omit
      const retry = await sb.from('icp').insert(rest)
      error = retry.error
    }

    if (error) return { ok: false, error: error.message }

    revalidatePath('/')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
