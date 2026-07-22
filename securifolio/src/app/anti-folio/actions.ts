'use server'

import { createClient } from '@/utils/supabase/server'

export async function checkCadastralNumber(cadastralNumber: string) {
  if (!cadastralNumber) return null

  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return null

  // Parser intelligent (No BS) pour éviter les conflits sur des nombres simples
  const cleanSearch = cadastralNumber.trim()
  const volMatch = cleanSearch.match(/vol(?:ume)?\s+([a-z0-9\s]+?)\s+folio\s+(\d+)/i)

  let query = supabaseServer.from('titres_fonciers').select('*')

  if (volMatch) {
    const vol = volMatch[1].trim().toUpperCase() // ex: AMA 171
    const fol = volMatch[2].trim()               // ex: 68
    query = query.eq('volume', vol).eq('folio', fol)
  } else {
    query = query.eq('numero_cadastral', cleanSearch)
  }

  const { data, error } = await query

  if (error) {
    console.error('Erreur Supabase:', error)
    return null
  }

  return data
}

export async function saveScanHistory(numeroCadastral: string, resultat: 'valid' | 'fraud' | 'pending') {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé' }

  const { error } = await supabaseServer
    .from('anti_folio_history')
    .insert([
      {
        agent_id: user.id,
        numero_cadastral: numeroCadastral,
        resultat: resultat,
      }
    ])

  if (error) {
    console.error('Erreur saveScanHistory:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function getScanHistory() {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return []

  const { data, error } = await supabaseServer
    .from('anti_folio_history')
    .select('*')
    .eq('agent_id', user.id)
    .order('date_scan', { ascending: false })
    .limit(5) // On garde l'historique compact (les 5 derniers scans)

  if (error) {
    console.error('Erreur getScanHistory:', error)
    return []
  }

  return data
}
