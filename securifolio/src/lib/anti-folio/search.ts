import type {
  AntiFolioOutcome,
  LandTitleSummary,
  SearchState,
} from './types'
import { deriveAntiFolioOutcome } from './verdict'

export type SearchResponse =
  | { ok: true; records: LandTitleSummary[] }
  | {
      ok: false
      code: 'UNAUTHENTICATED' | 'DATABASE_ERROR'
      message: string
    }

export interface SearchDependencies {
  getAuthenticatedUser: () => Promise<{ id: string } | null>
  searchTitles: (cadastralNumber: string) => Promise<{
    records: LandTitleSummary[] | null
    error: unknown
  }>
}

interface AntiFolioSearchFlowDependencies {
  checkCadastralNumber: (cadastralNumber: string) => Promise<SearchResponse>
  saveScanHistory: (
    cadastralNumber: string,
    result: SearchState,
  ) => Promise<unknown>
  refreshHistory: () => Promise<unknown>
}

interface AntiFolioSearchFlowResult {
  outcome: AntiFolioOutcome
  errorMessage: string | null
}

export async function executeAntiFolioSearchFlow(
  cadastralNumber: string,
  dependencies: AntiFolioSearchFlowDependencies,
): Promise<AntiFolioSearchFlowResult> {
  let response: SearchResponse

  try {
    response = await dependencies.checkCadastralNumber(cadastralNumber)
  } catch {
    return {
      outcome: deriveAntiFolioOutcome({ searchError: true }),
      errorMessage: 'Une erreur technique inattendue a interrompu la vérification.',
    }
  }

  const outcome = response.ok
    ? deriveAntiFolioOutcome({ records: response.records })
    : deriveAntiFolioOutcome({ searchError: true })
  const errorMessage = response.ok ? null : response.message

  if (response.ok || response.code === 'DATABASE_ERROR') {
    await bestEffort(() => dependencies.saveScanHistory(
      cadastralNumber,
      outcome.searchState,
    ))
  }
  await bestEffort(dependencies.refreshHistory)

  return { outcome, errorMessage }
}

async function bestEffort(operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation()
  } catch {
    // L’historique est annexe et ne modifie jamais le constat de recherche.
  }
}

export async function executeCadastralSearch(
  cadastralNumber: string,
  dependencies: SearchDependencies,
): Promise<SearchResponse> {
  try {
    const user = await dependencies.getAuthenticatedUser()

    if (!user) {
      return {
        ok: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentification requise pour interroger le registre.',
      }
    }

    const { records, error } = await dependencies.searchTitles(cadastralNumber)

    if (error) {
      return {
        ok: false,
        code: 'DATABASE_ERROR',
        message: 'La recherche du registre est temporairement indisponible.',
      }
    }

    return { ok: true, records: records ?? [] }
  } catch {
    return {
      ok: false,
      code: 'DATABASE_ERROR',
      message: 'La recherche du registre est temporairement indisponible.',
    }
  }
}
