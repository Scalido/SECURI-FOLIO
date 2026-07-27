'use server'

import { createClient } from '@/utils/supabase/server'
import {
  executeCadastralSearch,
  type SearchResponse,
} from '@/lib/anti-folio/search'
import type {
  LandTitleSummary,
  SearchState,
} from '@/lib/anti-folio/types'

export async function checkCadastralNumber(cadastralNumber: string): Promise<SearchResponse> {
  const supabaseServer = createClient()

  return executeCadastralSearch(cadastralNumber.trim(), {
    getAuthenticatedUser: async () => {
      const { data: { user } } = await supabaseServer.auth.getUser()
      return user ? { id: user.id } : null
    },
    searchTitles: async (cleanSearch) => {
      const volMatch = cleanSearch.match(
        /vol(?:ume)?\s+([a-z0-9\s]+?)\s+folio\s+(\d+)/i,
      )
      let query = supabaseServer
        .from('titres_fonciers')
        .select('id, numero_cadastral, volume, folio, nom_proprietaire, circonscription, statut')

      if (volMatch) {
        query = query
          .eq('volume', volMatch[1].trim().toUpperCase())
          .eq('folio', volMatch[2].trim())
      } else {
        query = query.eq('numero_cadastral', cleanSearch)
      }

      const { data, error } = await query
      return {
        records: data as LandTitleSummary[] | null,
        error,
      }
    },
  })
}

export async function saveScanHistory(
  numeroCadastral: string,
  resultat: SearchState | 'overlap_detected',
) {
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
