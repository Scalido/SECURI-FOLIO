'use server'

import { isValidParcelFeature } from '@/lib/spatial/parcel-geometry.mjs'
import { createClient } from '@/utils/supabase/server'
import { requireMfaForSensitiveRole } from '@/lib/security/mfa'

export async function getPendingTitles() {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé', data: [] }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'chef_cadastre') {
    return { success: false, error: 'Accès réservé au Chef du Cadastre', data: [] }
  }

  const mfaError = await requireMfaForSensitiveRole(supabaseServer, profile.role)
  if (mfaError) return { success: false, error: mfaError, data: [] }

  const { data, error } = await supabaseServer
    .from('titres_fonciers')
    .select('*')
    .eq('statut', 'En attente de validation cadastrale')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getPendingTitles:', error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function updateTitleStatus(titleId: string, newStatus: 'Validé techniquement' | 'Falsifié' | 'Litige', notes?: string) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé' }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'chef_cadastre') {
    return { success: false, error: 'Accès réservé au Chef du Cadastre' }
  }

  const mfaError = await requireMfaForSensitiveRole(supabaseServer, profile.role)
  if (mfaError) return { success: false, error: mfaError }

  if (!['Validé techniquement', 'Falsifié', 'Litige'].includes(newStatus)) return { success: false, error: 'Statut invalide.' }
  if (newStatus === 'Validé techniquement') {
    const { data: title, error } = await supabaseServer.from('titres_fonciers')
      .select('coordonnees_spatiales').eq('id', titleId).single()
    if (error || !title) return { success: false, error: 'Impossible de vérifier la parcelle.' }
    if (!isValidParcelFeature(title.coordonnees_spatiales)) return { success: false, error: 'Topographie requise : renseignez une parcelle valide avant la validation cadastrale.' }
  }

  const { error: updateError } = await supabaseServer
    .rpc('update_title_status_with_history', {
      p_title_id: titleId,
      p_new_status: newStatus,
      p_notes: notes || null
    })

  if (updateError) {
    console.error('Erreur updateTitleStatus:', updateError)
    return { success: false, error: updateError.message }
  }

  return { success: true }
}
