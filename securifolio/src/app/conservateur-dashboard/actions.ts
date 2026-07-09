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

  if (!profile || profile.role !== 'conservateur') {
    return { success: false, error: 'Accès réservé au Conservateur', data: [] }
  }

  const { data, error } = await supabaseServer
    .from('titres_fonciers')
    .select('*')
    .eq('statut', 'Validé techniquement')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur getPendingTitles:', error)
    return { success: false, error: error.message, data: [] }
  }

  return { success: true, data: data || [] }
}

export async function updateTitleStatus(titleId: string, newStatus: 'Valide' | 'Falsifié', notes?: string) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé' }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'conservateur') {
    return { success: false, error: 'Accès réservé au Conservateur' }
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
        action_type: newStatus === 'Valide' ? 'approved_by_conservateur' : 'rejected_by_conservateur',
        notes: notes || null
      }])
  }

  return { success: true }
}
