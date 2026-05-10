'use server'

import { revalidatePath } from 'next/cache'
import { serverClient, type FirstMessage, type LeadStatus } from '@/lib/supabase'

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const sb = serverClient()
  const { error } = await sb.from('leads').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateLeadFirstMessage(id: string, value: FirstMessage | null) {
  const sb = serverClient()
  const { error } = await sb.from('leads').update({ first_message: value }).eq('id', id)
  if (error) throw new Error(error.message)
}

export type IcpInput = {
  role: string
  industry: string
  company_size: string
  geography: string
  signal: string
  notes: string
}

export async function createIcp(input: IcpInput) {
  const sb = serverClient()
  const { count, error: countError } = await sb
    .from('icp')
    .select('id', { count: 'exact', head: true })
  if (countError) throw new Error(countError.message)
  if ((count ?? 0) > 0) throw new Error('ICP already exists')

  const payload = Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()]),
  )
  const { error } = await sb.from('icp').insert(payload)
  if (error) throw new Error(error.message)
  revalidatePath('/')
}
