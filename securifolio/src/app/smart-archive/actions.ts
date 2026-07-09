'use server'

import { createClient } from '@/utils/supabase/server'
import { certificateSchema } from '@/lib/validations'
import crypto from 'crypto'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCertificate(formData: any, scanUrl?: string, coordonneesSpatiales?: any, requiresTopography: boolean = false) {
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
    // IMPORTANT: On utilise le client standard maintenant que le RLS va être bien configuré
    const { error: updateError } = await supabaseServer
      .from('titres_fonciers')
      .update({ statut: 'Litige' })
      .eq('id', existingTitle.id)
      
    if (updateError) {
      console.error('Erreur mise à jour statut Litige:', updateError)
    }

    const { error: historyError } = await supabaseServer
      .from('smart_archive_history')
      .insert([{
        agent_id: user.id,
        numero_cadastral: numeroCadastral,
        action_type: 'rejected_duplicate'
      }])

    if (historyError) {
      console.error("Erreur insertion historique (doublon):", historyError)
      return { 
        success: false, 
        error: `Erreur Historique: ${historyError.message}` 
      }
    }

    return { 
      success: false, 
      error: 'TITRE_DEJA_NUMERISE', 
      message: 'Ce numéro cadastral est déjà enregistré dans le système. Le statut du titre existant a été automatiquement passé en "Litige".'
    }
  }

  // 5. NOUVEAU TITRE : On l'insère avec le statut "En attente d'audit"
  // Générer la signature cryptographique (Hash SHA-256)
  const dataToHash = `${numeroCadastral}-${validData.nom}-${validData.date_etablissement}-${coordonneesSpatiales ? JSON.stringify(coordonneesSpatiales) : 'no-coords'}`;
  const hashSignature = crypto.createHash('sha256').update(dataToHash).digest('hex');

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
      statut: "En attente de validation cadastrale", // Statut initial pour le Chef du Cadastre
      scan_url: scanUrl || null, // Lien vers l'image stockée
      coordonnees_spatiales: coordonneesSpatiales || null, // Polygon spatial (Technique B)
      hash_signature: hashSignature // Empreinte cryptographique
    }])

  if (insertError) {
    console.error('Erreur insertion nouveau titre:', insertError)
    return { success: false, error: `Erreur DB: ${insertError.message}` }
  }

  // 6. Historique de l'insertion
    const { error: historyError } = await supabaseServer
      .from('smart_archive_history')
      .insert([{
        agent_id: user.id,
        numero_cadastral: numeroCadastral,
        action_type: 'insert'
      }])

    if (historyError) {
      console.error("Erreur insertion historique (succès):", historyError)
      return { 
        success: false, 
        error: `Erreur Historique: ${historyError.message}` 
      }
    }

    return { success: true }
}

export async function getHistoryServer() {
  const supabaseServer = createClient()
  
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié' }

  const { data, error } = await supabaseServer
    .from('smart_archive_history')
    .select('*')
    .eq('agent_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error("Erreur getHistoryServer:", error)
    return { data: null, error: error.message }
  }
  return { data, error: null }
}
