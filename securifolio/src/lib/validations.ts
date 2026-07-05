import { z } from 'zod'

export const certificateSchema = z.object({
  nom: z.string().min(2, "Le nom du propriétaire doit contenir au moins 2 caractères."),
  numero_cadastral: z.string().min(5, "Le numéro cadastral est invalide."),
  volume: z.string().optional(),
  folio: z.string().optional(),
  circonscription: z.string().optional(),
  superficie: z.string().optional(),
  date_etablissement: z.string().optional(),
})

export type CertificateData = z.infer<typeof certificateSchema>
