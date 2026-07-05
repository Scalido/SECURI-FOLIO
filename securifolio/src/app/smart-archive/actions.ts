'use server'

import { createClient } from '@/utils/supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCertificate(formData: any) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé. Veuillez vous connecter.' }

  const numeroCadastral = formData.numero_cadastral?.trim()

  if (!numeroCadastral) {
    return { success: false, error: 'Le numéro cadastral est obligatoire.' }
  }

  // 1. Vérifier si le titre existe déjà
  const { data: existingTitle, error: searchError } = await supabaseServer
    .from('titres_fonciers')
    .select('id, statut')
    .eq('numero_cadastral', numeroCadastral)
    .single()

  if (searchError && searchError.code !== 'PGRST116') {
    // Une vraie erreur (pas juste "not found")
    console.error('Erreur recherche titre:', searchError)
    return { success: false, error: 'Erreur lors de la vérification de la base de données.' }
  }

  if (existingTitle) {
    // 2. DOUBLON DÉTECTÉ !
    
    // a. On passe le statut du titre existant en "Litige"
    const { error: updateError } = await supabaseServer
      .from('titres_fonciers')
      .update({ statut: 'Litige' })
      .eq('id', existingTitle.id)
      
    if (updateError) {
      console.error('Erreur mise à jour statut Litige:', updateError)
    }

    // b. On enregistre la tentative dans l'historique
    await supabaseServer
      .from('smart_archive_history')
      .insert([{
        agent_id: user.id,
        numero_cadastral: numeroCadastral,
        action_type: 'rejected_duplicate'
      }])

    return { 
      success: false, 
      error: 'TITRE_DEJA_NUMERISE', 
      message: 'Ce numéro cadastral est déjà enregistré dans le système. Le statut du titre existant a été automatiquement passé en "Litige".'
    }
  }

  // 3. NOUVEAU TITRE : On l'insère
  const { error: insertError } = await supabaseServer
    .from('titres_fonciers')
    .insert([{
      numero_cadastral: numeroCadastral,
      nom_proprietaire: formData.nom || '',
      volume: formData.volume || '',
      folio: formData.folio || '',
      circonscription: formData.circonscription || '',
      superficie: formData.superficie || '',
      date_enregistrement: formData.date_etablissement || new Date().toISOString(),
      statut: 'Valide'
    }])

  if (insertError) {
    console.error('Erreur insertion nouveau titre:', insertError)
    return { success: false, error: 'Erreur lors de l\'enregistrement du certificat.' }
  }

  // 4. Historique de l'insertion
  await supabaseServer
    .from('smart_archive_history')
    .insert([{
      agent_id: user.id,
      numero_cadastral: numeroCadastral,
      action_type: 'insert'
    }])

  return { success: true }
}
