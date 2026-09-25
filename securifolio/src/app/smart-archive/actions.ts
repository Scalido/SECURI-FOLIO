'use server'

import { createClient } from '@/utils/supabase/server'
import { certificateSchema } from '@/lib/validations'
import crypto from 'crypto'
import { isValidParcelFeature } from '@/lib/spatial/parcel-geometry.mjs'

function parseFrenchDate(value?: string | null): string | null | undefined {
  if (!value?.trim()) return null
  const text = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const months = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
  let year: number, month: number, day: number
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const french = text.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)
  const words = text.match(/^(\d{1,2})(?:er)?\s+([a-z]+)\s+(\d{4})$/)
  if (iso) [, year, month, day] = iso.map(Number)
  else if (french) [, day, month, year] = french.map(Number)
  else if (words) { day = Number(words[1]); month = months.indexOf(words[2]) + 1; year = Number(words[3]) }
  else return undefined
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined
  return date.toISOString()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveCertificate(formData: any, scanUrl?: string, coordonneesSpatiales?: any, isLocationUnknown: boolean = false) {
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

  if (isLocationUnknown) coordonneesSpatiales = null
  else if (!isValidParcelFeature(coordonneesSpatiales)) {
    return { success: false, error: 'Parcelle invalide. Fournissez un polygone fermé sans croisement, ou déclarez la localisation inconnue.' }
  }

  // 2. Validation Zod stricte
  const validationResult = certificateSchema.safeParse(formData)
  
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map(issue => issue.message).join(' ')
    return { success: false, error: `Données invalides : ${errorMessages}` }
  }

  const validData = validationResult.data
  const parsedDate = parseFrenchDate(validData.date_etablissement)
  if (parsedDate === undefined) return { success: false, error: "Date invalide. Utilisez JJ/MM/AAAA ou AAAA-MM-JJ, ou laissez la date vide si elle est inconnue." }
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
      p_date_enregistrement: parsedDate,
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
