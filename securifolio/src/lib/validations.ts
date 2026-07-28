import { z } from 'zod'
import { LAND_FILE_PIECE_TYPES } from '@/lib/land-files'

export const certificateSchema = z.object({
  nom: z.string().trim().min(2, "Le nom du propriétaire doit contenir au moins 2 caractères.").max(255, "Le nom du propriétaire est trop long."),
  numero_cadastral: z.string().trim().min(2, "Le numéro cadastral est invalide. Minimum 2 caractères.").max(80, "Le numéro cadastral est trop long.").regex(/^[A-Z0-9/._ -]+$/i, "Le numéro cadastral contient des caractères non autorisés."),
  volume: z.string().trim().max(50, "Le volume est trop long.").optional(),
  folio: z.string().trim().max(50, "Le folio est trop long.").optional(),
  circonscription: z.string().trim().max(255, "La circonscription est trop longue.").optional(),
  superficie: z.string().trim().max(100, "La superficie est trop longue.").optional(),
  date_etablissement: z.string().trim().max(100, "La date est trop longue.").optional().or(z.literal('')),
  description_immeuble: z.string().trim().max(2000, "La description de l'immeuble est trop longue.").optional(),
  situation: z.string().trim().max(1000, "La situation est trop longue.").optional(),
  charges_reelles: z.string().trim().max(2000, "Les charges réelles sont trop longues.").optional(),
  droits_constates: z.string().trim().max(2000, "Les droits constatés sont trop longs.").optional(),
  date_sceau: z.string().trim().max(100, "La date du sceau est trop longue.").optional().or(z.literal('')),
  signataire_conservateur: z.string().trim().max(255, "Le nom du signataire est trop long.").optional(),
})

export const smartArchiveSubmissionSchema = certificateSchema.extend({
  attested: z.literal(true),
})

export const dossierPieceSubmissionSchema = z.object({
  dossierId: z.string().uuid(),
  typePiece: z.enum(LAND_FILE_PIECE_TYPES),
  storagePath: z.string().min(1),
})

export type AgentProfileIdentity = {
  full_name: string | null
  role: string
  matricule: string | null
  fonction: string | null
}

export type CompleteAgentProfileIdentity = {
  full_name: string
  role: 'agent'
  matricule: string
  fonction: string
}

export type AgentProfileState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; profile: CompleteAgentProfileIdentity }

export function getExtractionReviewLabel() {
  return 'Extrait par IA — vérification humaine requise'
}

export function isCompleteAgentProfile(
  profile: AgentProfileIdentity | null,
): profile is CompleteAgentProfileIdentity {
  return Boolean(
    profile
    && profile.role === 'agent'
    && profile.full_name?.trim()
    && profile.matricule?.trim()
    && profile.fonction?.trim(),
  )
}

export function canSubmitArchive(
  isCertified: boolean,
  isSaving: boolean,
  hasValidAgentProfile: boolean,
) {
  return isCertified && !isSaving && hasValidAgentProfile
}

export function buildSmartArchiveAttestation(profile: AgentProfileIdentity) {
  const name = profile.full_name?.trim() || 'Nom non renseigné'
  const fonction = profile.fonction?.trim() || 'Fonction non renseignée'
  const matricule = profile.matricule?.trim() || 'Matricule non renseigné'

  return `En tant qu'agent assermenté ${name} (${fonction}, rôle ${profile.role}, matricule ${matricule}), j'atteste sur l'honneur avoir vérifié visuellement la conformité de ces données avec le document physique original. Toute altération non signalée engagera ma responsabilité pénale.`
}

export type CertificateData = z.infer<typeof certificateSchema>
export type SmartArchiveSubmission = z.infer<typeof smartArchiveSubmissionSchema>
