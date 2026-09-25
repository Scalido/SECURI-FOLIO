'use server'

import { createClient } from '@/utils/supabase/server'

export async function getCurrentNavigationRole(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const email = user.email?.trim().toLowerCase()
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  if (email && adminEmails.includes(email)) return 'admin'

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role
  return role === 'agent' || role === 'chef_cadastre' || role === 'conservateur' || role === 'notaire' || role === 'citoyen'
    ? role
    : null
}
