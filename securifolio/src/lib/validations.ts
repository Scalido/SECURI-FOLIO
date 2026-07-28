import { z } from 'zod'

export const certificateSchema = z.object({
  nom: z.string().trim().min(2, "Le nom du propriétaire doit contenir au moins 2 caractères.").max(255, "Le nom du propriétaire est trop long."),
  numero_cadastral: z.string().trim().min(2, "Le numéro cadastral est invalide. Minimum 2 caractères.").max(80, "Le numéro cadastral est trop long.").regex(/^[A-Z0-9/._ -]+$/i, "Le numéro cadastral contient des caractères non autorisés."),
  volume: z.string().trim().max(50, "Le volume est trop long.").optional(),
  folio: z.string().trim().max(50, "Le folio est trop long.").optional(),
  circonscription: z.string().trim().max(255, "La circonscription est trop longue.").optional(),
  superficie: z.string().trim().max(100, "La superficie est trop longue.").optional(),
  date_etablissement: z.string().trim().max(100, "La date est trop longue.").optional().or(z.literal('')),
})

export const smartArchiveSubmissionSchema = certificateSchema.extend({
  attested: z.literal(true),
})

export type AgentProfileIdentity = {
  full_name: string | null
  role: string
  matricule: string | null
  fonction: string | null
}

export const SMART_ARCHIVE_DOCUMENT_VERSION = '1'

export function getExtractionReviewLabel() {
  return 'Extrait par IA — vérification humaine requise'
}

export function canSubmitArchive(isCertified: boolean, isSaving: boolean) {
  return isCertified && !isSaving
}

export function buildSmartArchiveAttestation(profile: AgentProfileIdentity) {
  const name = profile.full_name?.trim() || 'Nom non renseigné'
  const fonction = profile.fonction?.trim() || 'Fonction non renseignée'
  const matricule = profile.matricule?.trim() || 'Matricule non renseigné'

  return `En tant qu'agent assermenté ${name} (${fonction}, rôle ${profile.role}, matricule ${matricule}), j'atteste sur l'honneur avoir vérifié visuellement la conformité de ces données avec le document physique original. Toute altération non signalée engagera ma responsabilité pénale.`
}

export type CertificateData = z.infer<typeof certificateSchema>
export type SmartArchiveSubmission = z.infer<typeof smartArchiveSubmissionSchema>
