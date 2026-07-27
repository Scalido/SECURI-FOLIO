import type {
  AdministrativeStatus,
  AntiFolioOutcome,
  LandTitleSummary,
  SearchState,
  SpatialState,
} from './types'

export interface DeriveAntiFolioOutcomeInput {
  records?: LandTitleSummary[]
  searchError?: boolean
  spatialState?: SpatialState
}

export function deriveAntiFolioOutcome({
  records = [],
  searchError = false,
  spatialState = 'not_checked',
}: DeriveAntiFolioOutcomeInput): AntiFolioOutcome {
  const searchState = deriveSearchState(records, searchError)
  const administrativeStatus = searchState === 'match' ? records[0].statut : null

  return {
    searchState,
    spatialState,
    administrativeStatus,
    records,
    evidence: deriveEvidence(records.length, searchState, spatialState, administrativeStatus),
    requiresHumanReview: requiresHumanReview(searchState, spatialState),
  }
}

function deriveSearchState(records: LandTitleSummary[], searchError: boolean): SearchState {
  if (searchError) return 'technical_error'
  if (records.length === 0) return 'not_found'
  if (records.length > 1) return 'ambiguous'
  return 'match'
}

function requiresHumanReview(searchState: SearchState, spatialState: SpatialState): boolean {
  return searchState !== 'match' || [
    'geometry_missing',
    'overlap_detected',
    'technical_error',
  ].includes(spatialState)
}

function deriveEvidence(
  recordCount: number,
  searchState: SearchState,
  spatialState: SpatialState,
  administrativeStatus: AdministrativeStatus | null,
): string[] {
  const searchEvidence = searchState === 'technical_error'
    ? 'La recherche du registre a rencontré une erreur technique.'
    : `${recordCount} correspondance${recordCount === 1 ? '' : 's'} trouvée${recordCount === 1 ? '' : 's'} dans le registre.`
  const statusEvidence = administrativeStatus
    ? [`Statut administratif enregistré : ${administrativeStatus}.`]
    : []

  return [searchEvidence, spatialEvidence(spatialState), ...statusEvidence]
}

function spatialEvidence(spatialState: SpatialState): string {
  switch (spatialState) {
    case 'geometry_missing':
      return 'Contrôle spatial non effectué : géométrie absente.'
    case 'clear':
      return 'Contrôle spatial effectué : aucun chevauchement signalé.'
    case 'overlap_detected':
      return 'Contrôle spatial effectué : chevauchement détecté.'
    case 'technical_error':
      return 'Contrôle spatial indisponible pour cause d’erreur technique.'
    default:
      return 'Contrôle spatial non effectué.'
  }
}
