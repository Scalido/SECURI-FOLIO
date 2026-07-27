import type { LandTitleSummary } from './types'

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
