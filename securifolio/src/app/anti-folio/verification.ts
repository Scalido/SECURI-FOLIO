export type TitleResult = { statut: string | null }
export type VerificationStatus = 'valid' | 'pending' | 'disputed' | 'falsified' | 'multiple' | 'missing' | 'error' | 'unknown'

export function classifyTitleResults(rows: TitleResult[] | null): VerificationStatus {
  if (rows === null) return 'error'
  if (rows.length === 0) return 'missing'
  if (rows.length > 1) return 'multiple'
  switch (rows[0].statut) {
    case 'Valide': return 'valid'
    case 'Litige': return 'disputed'
    case 'Falsifié': return 'falsified'
    case 'En attente de validation cadastrale':
    case 'Validé techniquement': return 'pending'
    default: return 'unknown'
  }
}

export function selectedCirconscription(value: string): string | null {
  return ['Gombe', 'Ngaliema', 'Goma', 'Lubumbashi'].includes(value) ? value : null
}
