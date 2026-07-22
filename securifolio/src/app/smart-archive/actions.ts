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
    return { success: false, error: 'Accès refusé. Seuls les agents assermentés peuvent transmettre un document (rôle "agent" requis dans la DB).' }
  }

  if (requiresTopography && !coordonneesSpatiales) {
    return { success: false, error: 'Coordonnées topographiques requises pour ce dossier.' }
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
    // 4. DOUBLON DÉTECTÉ : on journalise l'alerte sans muter automatiquement le titre existant.
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
      message: 'Ce numéro cadastral est déjà enregistré dans le système. Une alerte de doublon a été journalisée pour revue administrative.'
    }
  }

  // 5. NOUVEAU TITRE : On l'insère avec le statut "En attente d'audit"
  // Générer la signature cryptographique (Hash SHA-256)
  const dataToSign = JSON.stringify({
    numero_cadastral: numeroCadastral,
    nom: validData.nom,
    date_etablissement: validData.date_etablissement || null,
    coordonnees_spatiales: coordonneesSpatiales || null,
    agent_id: user.id
  });
  const signatureSecret = process.env.CERTIFICATE_HMAC_SECRET;

  if (!signatureSecret) {
    return { success: false, error: 'Secret de signature CERTIFICATE_HMAC_SECRET manquant.' }
  }

  const hashSignature = crypto.createHmac('sha256', signatureSecret).update(dataToSign).digest('hex');

  const { error: insertError } = await supabaseServer
    .rpc('create_title_with_history', {
      p_numero_cadastral: numeroCadastral,
      p_nom_proprietaire: validData.nom,
      p_volume: validData.volume || '',
      p_folio: validData.folio || '',
      p_circonscription: validData.circonscription || '',
      p_superficie: validData.superficie || '',
      p_date_enregistrement: validData.date_etablissement || new Date().toISOString(),
      p_scan_url: scanUrl || null,
      p_coordonnees_spatiales: coordonneesSpatiales || null,
      p_hash_signature: hashSignature
    })

  if (insertError) {
    console.error('Erreur insertion nouveau titre:', insertError)
    return { success: false, error: `Erreur DB: ${insertError.message}` }
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
