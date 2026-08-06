'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  type CertificateData,
  dossierPieceSubmissionSchema,
  isCompleteAgentProfile,
  smartArchiveSubmissionSchema,
} from '@/lib/validations'
import {
  detectLandFileFormat,
  type DocumentChecklist,
} from '@/lib/land-files'
import {
  buildIntegrityEnvelope,
  sha256,
  verifyIntegrityEnvelope,
} from '@/lib/documents/integrity'
import { withDefinitiveObjectRetention } from '@/lib/documents/temporary-analysis'

const PRIVATE_DOCUMENT_BUCKET = 'scans_certificats'
const SIGNED_URL_TTL_SECONDS = 300
const ADMINISTRATIVE_DOCUMENT_ROLES = new Set([
  'agent',
  'chef_cadastre',
  'conservateur',
  'notaire',
])

function parseFrenchDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString();

  const months: Record<string, string> = {
    'janvier': '01', 'février': '02', 'fevrier': '02', 'mars': '03', 'avril': '04',
    'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08', 'aout': '08',
    'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12', 'decembre': '12'
  };

  const match = dateStr.toLowerCase().match(/(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2]];
    const year = match[3];
    if (month) {
      return new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
    }
  }

  const timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) return new Date(timestamp).toISOString();

  return new Date().toISOString(); // Fallback
}

function parseOptionalFrenchDate(dateStr?: string | null): string | null {
  return dateStr?.trim() ? parseFrenchDate(dateStr) : null
}

function ownsStoragePath(
  path: string,
  userId: string,
  purpose: 'temporary' | 'documents',
) {
  const segments = path.split('/')

  return segments.length === 3
    && segments[0] === purpose
    && segments[1] === userId
    && /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segments[2])
    && segments[2] !== '.'
    && segments[2] !== '..'
}

async function getAuthenticatedAgent() {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) {
    return {
      supabaseServer,
      user: null,
      profile: null,
      error: 'Non autorisé. Veuillez vous connecter.',
    }
  }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('full_name, role, matricule, fonction, circonscription')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') {
    return {
      supabaseServer,
      user: null,
      profile: null,
      error: 'Accès refusé. Rôle agent requis.',
    }
  }

  return { supabaseServer, user, profile, error: null }
}

export async function reservePrivateStoragePath(
  purpose: 'temporary' | 'documents',
  extension: string,
) {
  const { user, error } = await getAuthenticatedAgent()

  if (!user) return { data: null, error }

  const safeExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
  return {
    data: {
      path: `${purpose}/${user.id}/${crypto.randomUUID()}.${safeExtension}`,
    },
    error: null,
  }
}

export async function getTemporaryAnalysisUrl(storagePath: string) {
  const { user, error } = await getAuthenticatedAgent()

  if (!user) return { data: null, error }
  if (!ownsStoragePath(storagePath, user.id, 'temporary')) {
    return { data: null, error: 'Chemin de stockage non autorisé.' }
  }

  const { data, error: signedUrlError } = await createAdminClient().storage
    .from(PRIVATE_DOCUMENT_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (signedUrlError || !data) {
    return {
      data: null,
      error: signedUrlError?.message || 'Impossible de créer l’URL temporaire.',
    }
  }

  return { data: { signedUrl: data.signedUrl }, error: null }
}

export async function deleteTemporaryScan(storagePath: string) {
  const { user, error } = await getAuthenticatedAgent()

  if (!user) return { success: false, error }
  if (!ownsStoragePath(storagePath, user.id, 'temporary')) {
    return { success: false, error: 'Chemin de stockage non autorisé.' }
  }

  const { error: removeError } = await createAdminClient().storage
    .from(PRIVATE_DOCUMENT_BUCKET)
    .remove([storagePath])

  return removeError
    ? { success: false, error: removeError.message }
    : { success: true }
}

export async function saveCertificate(
  submission: unknown,
  storagePath?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coordonneesSpatiales?: any,
  requiresTopography: boolean = false,
) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { success: false, error: 'Non autorisé. Veuillez vous connecter.' }

  const definitiveStoragePath = storagePath && ownsStoragePath(
    storagePath,
    user.id,
    'documents',
  )
    ? storagePath
    : null
  const privateStorage = definitiveStoragePath
    ? createAdminClient().storage
    : null
  const rejectPreflight = async (error: string) => {
    if (!privateStorage || !definitiveStoragePath) {
      return { success: false as const, error }
    }

    return withDefinitiveObjectRetention({
      operation: async () => ({ success: false as const, error }),
      cleanup: async () => {
        const { error: removeError } = await privateStorage
          .from(PRIVATE_DOCUMENT_BUCKET)
          .remove([definitiveStoragePath])

        if (removeError) throw new Error(removeError.message)
      },
    })
  }

  // 1. RBAC : Vérifier si l'utilisateur est un agent
  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('full_name, role, matricule, fonction')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'agent') {
    return rejectPreflight('Accès refusé. Seuls les agents assermentés peuvent transmettre un document (rôle "agent" requis dans la DB).')
  }

  if (!isCompleteAgentProfile(profile)) {
    return rejectPreflight('Profil agent incomplet : nom, fonction et matricule sont obligatoires.')
  }

  if (requiresTopography && !coordonneesSpatiales) {
    return rejectPreflight('Coordonnées topographiques requises pour ce dossier.')
  }

  if (
    typeof submission !== 'object'
    || submission === null
    || !('attested' in submission)
    || submission.attested !== true
  ) {
    return rejectPreflight('Attestation obligatoire avant transmission.')
  }

  // 2. Validation Zod stricte
  const validationResult = smartArchiveSubmissionSchema.safeParse(submission)
  
  if (!validationResult.success) {
    const errorMessages = validationResult.error.issues.map(issue => issue.message).join(' ')
    return rejectPreflight(`Données invalides : ${errorMessages}`)
  }

  const validData = validationResult.data
  const numeroCadastral = validData.numero_cadastral.trim()

  if (!definitiveStoragePath || !privateStorage) {
    return { success: false, error: 'Chemin de stockage privé invalide.' }
  }

  const operation = async () => {
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
      .rpc('record_smart_archive_duplicate', {
        p_numero_cadastral: numeroCadastral,
      })

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

  const { data: storedFile, error: downloadError } = await privateStorage
    .from(PRIVATE_DOCUMENT_BUCKET)
    .download(definitiveStoragePath)

  if (downloadError || !storedFile) {
    return {
      success: false,
      error: downloadError?.message || 'Document privé introuvable.',
    }
  }

  const parsedDate = parseFrenchDate(validData.date_etablissement);
  const persistedMetadata: CertificateData = {
    ...validData,
    numero_cadastral: numeroCadastral,
    date_etablissement: parsedDate,
    description_immeuble: validData.description_immeuble || '',
    situation: validData.situation || '',
    charges_reelles: validData.charges_reelles || '',
    droits_constates: validData.droits_constates || '',
    date_sceau: parseOptionalFrenchDate(validData.date_sceau) || '',
    signataire_conservateur: validData.signataire_conservateur || '',
  }

  let integrityEnvelope
  try {
    const fileBytes = new Uint8Array(await storedFile.arrayBuffer())
    integrityEnvelope = buildIntegrityEnvelope(
      sha256(fileBytes),
      persistedMetadata,
      user.id,
      2,
    )
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Échec du scellement.',
    }
  }

  const { error: insertError } = await supabaseServer
    .rpc('create_title_with_history', {
      p_numero_cadastral: numeroCadastral,
      p_nom_proprietaire: validData.nom,
      p_volume: validData.volume || '',
      p_folio: validData.folio || '',
      p_circonscription: validData.circonscription || '',
      p_superficie: validData.superficie || '',
      p_date_enregistrement: parsedDate,
      p_storage_path: definitiveStoragePath,
      p_file_sha256: integrityEnvelope.fileSha256,
      p_metadata_hmac: integrityEnvelope.metadataHmac,
      p_coordonnees_spatiales: coordonneesSpatiales || null,
      p_attested: true,
      p_description_immeuble: validData.description_immeuble || null,
      p_situation: validData.situation || null,
      p_charges_reelles: validData.charges_reelles || null,
      p_droits_constates: validData.droits_constates || null,
      p_date_sceau: parseOptionalFrenchDate(validData.date_sceau),
      p_signataire_conservateur:
        validData.signataire_conservateur || null,
    })

  if (insertError) {
    console.error('Erreur insertion nouveau titre:', insertError)
    return { success: false, error: `Erreur DB: ${insertError.message}` }
  }

  return { success: true }
  }

  return withDefinitiveObjectRetention({
    cleanup: async () => {
      const { error: removeError } = await privateStorage
        .from(PRIVATE_DOCUMENT_BUCKET)
        .remove([definitiveStoragePath])

      if (removeError) throw new Error(removeError.message)
    },
    operation,
  })
}

export async function addDossierPiece(submission: unknown) {
  const { supabaseServer, user, error } = await getAuthenticatedAgent()
  if (!user) return { success: false, error }

  const parsed = dossierPieceSubmissionSchema.safeParse(submission)
  if (!parsed.success) {
    return { success: false, error: 'Données de pièce invalides.' }
  }

  const { dossierId, typePiece, storagePath } = parsed.data
  if (!ownsStoragePath(storagePath, user.id, 'documents')) {
    return { success: false, error: 'Chemin de stockage privé invalide.' }
  }

  const privateStorage = createAdminClient().storage
  const operation = async () => {
    const { data: storedFile, error: downloadError } = await privateStorage
      .from(PRIVATE_DOCUMENT_BUCKET)
      .download(storagePath)

    if (downloadError || !storedFile) {
      return {
        success: false as const,
        error: downloadError?.message || 'Document privé introuvable.',
      }
    }

    const fileBytes = new Uint8Array(await storedFile.arrayBuffer())
    if (!detectLandFileFormat(fileBytes.subarray(0, 8))) {
      return {
        success: false as const,
        error: 'Format invalide. Utilisez un fichier PDF, JPEG ou PNG.',
      }
    }

    const fileSha256 = sha256(fileBytes)
    const { data: version, error: insertError } = await supabaseServer.rpc(
      'add_dossier_piece',
      {
        p_dossier_id: dossierId,
        p_type_piece: typePiece,
        p_storage_path: storagePath,
        p_file_sha256: fileSha256,
      },
    )

    if (insertError) {
      return { success: false as const, error: insertError.message }
    }

    return { success: true as const, version: Number(version) }
  }

  return withDefinitiveObjectRetention({
    operation,
    cleanup: async () => {
      const { error: removeError } = await privateStorage
        .from(PRIVATE_DOCUMENT_BUCKET)
        .remove([storagePath])

      if (removeError) throw new Error(removeError.message)
    },
  })
}

export async function getDocumentChecklist(
  numeroCadastral: string,
): Promise<{
  data: DocumentChecklist | null
  dossierId: string | null
  error: string | null
}> {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) {
    return { data: null, dossierId: null, error: 'Non authentifié' }
  }

  const { data: title, error: titleError } = await supabaseServer
    .from('titres_fonciers')
    .select('dossier_id')
    .eq('numero_cadastral', numeroCadastral.trim())
    .single()

  if (titleError || !title?.dossier_id) {
    return {
      data: null,
      dossierId: null,
      error: titleError?.message || 'Dossier foncier introuvable.',
    }
  }

  const { data, error } = await supabaseServer.rpc(
    'get_dossier_document_checklist',
    { p_dossier_id: title.dossier_id },
  )

  if (error || !data) {
    return {
      data: null,
      dossierId: title.dossier_id,
      error: error?.message || 'Checklist documentaire indisponible.',
    }
  }

  return {
    data: data as DocumentChecklist,
    dossierId: title.dossier_id,
    error: null,
  }
}

export async function getDossierDocumentChecklist(
  dossierId: string,
): Promise<{ data: DocumentChecklist | null; error: string | null }> {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) return { data: null, error: 'Non authentifié' }

  const parsedId = dossierPieceSubmissionSchema.shape.dossierId.safeParse(
    dossierId,
  )
  if (!parsedId.success) {
    return { data: null, error: 'Identifiant de dossier invalide.' }
  }

  const { data, error } = await supabaseServer.rpc(
    'get_dossier_document_checklist',
    { p_dossier_id: parsedId.data },
  )

  if (error || !data) {
    return {
      data: null,
      error: error?.message || 'Checklist documentaire indisponible.',
    }
  }

  return { data: data as DocumentChecklist, error: null }
}

export async function listManageableDossiers(): Promise<{
  data: Array<{
    id: string
    numeroDossier: string
    statut: string
  }> | null
  error: string | null
}> {
  const { supabaseServer, user, profile, error } =
    await getAuthenticatedAgent()

  if (!user || !profile) {
    return { data: null, error }
  }

  let query = supabaseServer
    .from('dossiers_fonciers')
    .select('id, numero_dossier, statut')
    .order('created_at', { ascending: false })
    .limit(50)

  if (profile.circonscription) {
    query = query.eq('circonscription', profile.circonscription)
  }

  const { data, error: queryError } = await query
  if (queryError) {
    return { data: null, error: queryError.message }
  }

  return {
    data: (data || []).map(dossier => ({
      id: dossier.id,
      numeroDossier: dossier.numero_dossier,
      statut: dossier.statut,
    })),
    error: null,
  }
}

export async function getAdministrativeDocument(titleId: string) {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) {
    return { success: false, integrity: 'failed', error: 'Non authentifié.' }
  }

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role, circonscription')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMINISTRATIVE_DOCUMENT_ROLES.has(profile.role)) {
    return { success: false, integrity: 'failed', error: 'Accès refusé.' }
  }

  const { data: title, error: titleError } = await supabaseServer
    .from('titres_fonciers')
    .select('id, numero_cadastral, nom_proprietaire, volume, folio, circonscription, superficie, date_enregistrement, storage_path, file_sha256, metadata_hmac, document_version, integrity_schema_version, dossier_id, description_immeuble, situation, charges_reelles, droits_constates, date_sceau, signataire_conservateur')
    .eq('id', titleId)
    .single()

  if (titleError || !title) {
    return { success: false, integrity: 'failed', error: 'Document introuvable.' }
  }

  if (
    profile.circonscription
    && profile.circonscription !== title.circonscription
  ) {
    return { success: false, integrity: 'failed', error: 'Accès refusé.' }
  }

  // Le client service-role n’est créé qu’après authentification, RBAC,
  // visibilité autorisée du titre et contrôle de circonscription.
  const adminClient = createAdminClient()
  const privateStorage = adminClient.storage

  const writeIntegrityAudit = async (passed: boolean) => {
    try {
      const { error } = await adminClient.rpc(
        'log_document_integrity_check',
        {
          p_title_id: titleId,
          p_passed: passed,
          p_actor_id: user.id,
        },
      )

      if (error) {
        console.error('Journalisation du contrôle d’intégrité impossible:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Journalisation du contrôle d’intégrité impossible:', error)
      return false
    }
  }

  const failIntegrityCheck = async (reason: string, cause?: unknown) => {
    console.error('Contrôle d’intégrité administratif refusé:', {
      titleId,
      reason,
      cause,
    })
    await writeIntegrityAudit(false)

    return {
      success: false as const,
      integrity: 'failed' as const,
      error: 'Contrôle d’intégrité échoué.',
    }
  }

  try {
    if (
      !title.storage_path
      || !/^[a-f0-9]{64}$/.test(title.file_sha256 || '')
      || !/^[a-f0-9]{64}$/.test(title.metadata_hmac || '')
      || !Number.isInteger(title.document_version)
      || title.document_version < 1
      || !Number.isInteger(title.integrity_schema_version)
      || ![1, 2].includes(title.integrity_schema_version)
    ) {
      return failIntegrityCheck('enveloppe absente ou malformée')
    }

    // Lecture privilégiée strictement limitée à l’auteur du scellement :
    // la policy utilisateur de l’historique reste propriétaire uniquement.
    const { data: creationEvent, error: historyError } = await adminClient
      .from('smart_archive_history')
      .select('agent_id')
      .eq('numero_cadastral', title.numero_cadastral)
      .eq('document_version', title.document_version)
      .eq('action_type', 'insert')
      .single()

    if (historyError || !creationEvent?.agent_id) {
      return failIntegrityCheck('auteur du scellement inaccessible', historyError)
    }

    if (
      !ownsStoragePath(
        title.storage_path,
        creationEvent.agent_id,
        'documents',
      )
    ) {
      return failIntegrityCheck('chemin persistant invalide')
    }

    const { data: storedFile, error: downloadError } = await privateStorage
      .from(PRIVATE_DOCUMENT_BUCKET)
      .download(title.storage_path)

    if (downloadError || !storedFile) {
      return failIntegrityCheck('document privé indisponible', downloadError)
    }

    const legacyMetadata: CertificateData = {
      nom: title.nom_proprietaire,
      numero_cadastral: title.numero_cadastral,
      volume: title.volume,
      folio: title.folio,
      circonscription: title.circonscription,
      superficie: title.superficie || '',
      date_etablissement: title.date_enregistrement || '',
    }
    const metadata: CertificateData = title.integrity_schema_version === 2
      ? {
          ...legacyMetadata,
          description_immeuble: title.description_immeuble || '',
          situation: title.situation || '',
          charges_reelles: title.charges_reelles || '',
          droits_constates: title.droits_constates || '',
          date_sceau: title.date_sceau || '',
          signataire_conservateur: title.signataire_conservateur || '',
        }
      : legacyMetadata

    const integrityPassed = verifyIntegrityEnvelope(
      {
        fileSha256: title.file_sha256,
        metadataHmac: title.metadata_hmac,
      },
      new Uint8Array(await storedFile.arrayBuffer()),
      metadata,
      creationEvent.agent_id,
      title.integrity_schema_version,
    )

    if (!integrityPassed) {
      return failIntegrityCheck('empreinte ou HMAC invalide')
    }

    const { data: signedUrl, error: signedUrlError } = await privateStorage
      .from(PRIVATE_DOCUMENT_BUCKET)
      .createSignedUrl(title.storage_path, SIGNED_URL_TTL_SECONDS)

    if (signedUrlError || !signedUrl) {
      return failIntegrityCheck(
        'génération de l’URL signée impossible',
        signedUrlError,
      )
    }

    if (!await writeIntegrityAudit(true)) {
      return {
        success: false,
        integrity: 'failed' as const,
        error: 'Journalisation du contrôle impossible.',
      }
    }

    return {
      success: true,
      integrity: 'passed' as const,
      signedUrl: signedUrl.signedUrl,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    }
  } catch (error) {
    return failIntegrityCheck('erreur technique pendant le contrôle', error)
  }
}

export async function getConnectedAgentProfile() {
  const supabaseServer = createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { data: null, error: 'Non authentifié' }

  const { data, error } = await supabaseServer
    .from('profiles')
    .select('full_name, role, matricule, fonction')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return { data: null, error: error?.message || 'Profil agent introuvable' }
  }

  if (!isCompleteAgentProfile(data)) {
    return {
      data: null,
      error: 'Profil agent incomplet : nom, fonction et matricule sont obligatoires.',
    }
  }

  return { data, error: null }
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
