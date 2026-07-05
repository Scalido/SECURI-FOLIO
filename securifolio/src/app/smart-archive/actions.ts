'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { certificateSchema } from '@/lib/validations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCertificate(formData: any, scanUrl?: string) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé. Veuillez vous connecter.' }

  // 1. RBAC : Vérifier si l'utilisateur est un agent
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') {
    return { success: false, error: 'Accès refusé. Seuls les agents assermentés peuvent sceller un document.' }
  }

  // 2. Validation Zod stricte
  const validationResult = certificateSchema.safeParse(formData)
  
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map(issue => issue.message).join(' ')
    return { success: false, error: `Données invalides : ${errorMessages}` }
  }

  const validData = validationResult.data
  const numeroCadastral = validData.numero_cadastral.trim()

  // 3. Vérifier si le titre existe déjà
  const { data: existingTitle, error: searchError } = await supabaseServer
    .from('titres_fonciers')
    .select('id, statut')
    .eq('numero_cadastral', numeroCadastral)
    .single()

  if (searchError && searchError.code !== 'PGRST116') {
    console.error('Erreur recherche titre:', searchError)
    return { success: false, error: 'Erreur lors de la vérification de la base de données.' }
  }

  if (existingTitle) {
    // 4. DOUBLON DÉTECTÉ !
    const supabaseAdmin = createAdminClient()
    const { error: updateError } = await supabaseAdmin
      .from('titres_fonciers')
      .update({ statut: 'Litige' })
      .eq('id', existingTitle.id)
      
    if (updateError) {
      console.error('Erreur mise à jour statut Litige:', updateError)
    }

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

  // 5. NOUVEAU TITRE : On l'insère avec le statut "En attente d'audit"
  const { error: insertError } = await supabaseServer
    .from('titres_fonciers')
    .insert([{
      numero_cadastral: numeroCadastral,
      nom_proprietaire: validData.nom,
      volume: validData.volume || '',
      folio: validData.folio || '',
      circonscription: validData.circonscription || '',
      superficie: validData.superficie || '',
      date_enregistrement: validData.date_etablissement || new Date().toISOString(),
      statut: "En attente d'audit", // Changement majeur ici
      scan_url: scanUrl || null // Lien vers l'image stockée
    }])

  if (insertError) {
    console.error('Erreur insertion nouveau titre:', insertError)
    return { success: false, error: 'Erreur lors de l\'enregistrement du certificat.' }
  }

  // 6. Historique de l'insertion
  await supabaseServer
    .from('smart_archive_history')
    .insert([{
      agent_id: user.id,
      numero_cadastral: numeroCadastral,
      action_type: 'insert'
    }])

  return { success: true }
}
