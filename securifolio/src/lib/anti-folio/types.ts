export type SearchState =
  | 'match'
  | 'not_found'
  | 'ambiguous'
  | 'technical_error'

export type SpatialState =
  | 'not_checked'
  | 'geometry_missing'
  | 'clear'
  | 'overlap_detected'
  | 'technical_error'

export type AdministrativeStatus =
  | 'Valide'
  | 'Litige'
  | 'Falsifié'
  | 'En attente de validation cadastrale'
  | 'Validé techniquement'

export interface LandTitleSummary {
  id: string
  numero_cadastral: string
  volume: string
  folio: string
  nom_proprietaire: string
  circonscription: string
  statut: AdministrativeStatus
}

export interface AntiFolioOutcome {
  searchState: SearchState
  spatialState: SpatialState
  administrativeStatus: AdministrativeStatus | null
  records: LandTitleSummary[]
  evidence: string[]
  requiresHumanReview: boolean
}
