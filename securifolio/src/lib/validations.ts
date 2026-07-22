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

export type CertificateData = z.infer<typeof certificateSchema>
