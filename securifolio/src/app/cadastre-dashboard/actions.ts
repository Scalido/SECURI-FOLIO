'use server'

import { createClient } from '@/utils/supabase/server'

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

  // Mettre à jour le statut
  const { error: updateError } = await supabaseServer
    .from('titres_fonciers')
    .update({ statut: newStatus })
    .eq('id', titleId)

  if (updateError) {
    console.error('Erreur updateTitleStatus:', updateError)
    return { success: false, error: updateError.message }
  }

  // On récupère le numéro cadastral pour l'historique
  const { data: title } = await supabaseServer
    .from('titres_fonciers')
    .select('numero_cadastral')
    .eq('id', titleId)
    .single()

  if (title) {
    await supabaseServer
      .from('smart_archive_history')
      .insert([{
        agent_id: user.id,
        numero_cadastral: title.numero_cadastral,
        action_type: newStatus === 'Validé techniquement' ? 'approved_by_cadastre' : 'rejected_by_cadastre',
        notes: notes || null
      }])
  }

  return { success: true }
}
