import { describe, expect, it } from 'vitest'

import {
  executeAntiFolioSearchFlow,
  executeCadastralSearch,
} from '@/lib/anti-folio/search'
import { deriveAntiFolioOutcome } from '@/lib/anti-folio/verdict'

describe('recherche Anti-Folio', () => {
  it('conserve un match lorsque l’écriture ou le rafraîchissement de l’historique échoue', async () => {
    const title = {
      id: 'title-1',
      numero_cadastral: '1178',
      volume: 'AMA 171',
      folio: '68',
      nom_proprietaire: 'Kanku',
      circonscription: 'Gombe',
      statut: 'Valide' as const,
    }

    const result = await executeAntiFolioSearchFlow('1178', {
      checkCadastralNumber: async () => ({ ok: true, records: [title] }),
      saveScanHistory: async () => {
        throw new Error('history unavailable')
      },
      refreshHistory: async () => {
        throw new Error('history unavailable')
      },
    })

    expect(result.outcome.searchState).toBe('match')
    expect(result.outcome.records).toEqual([title])
    expect(result.errorMessage).toBeNull()
  })

  it('retourne les titres trouvés pour un agent authentifié', async () => {
    const title = {
      id: 'title-1',
      numero_cadastral: '1178',
      volume: 'AMA 171',
      folio: '68',
      nom_proprietaire: 'Kanku',
      circonscription: 'Gombe',
      statut: 'Valide' as const,
    }

    const response = await executeCadastralSearch('1178', {
      getAuthenticatedUser: async () => ({ id: 'agent-1' }),
      searchTitles: async () => ({ records: [title], error: null }),
    })

    expect(response).toEqual({ ok: true, records: [title] })
  })

  it('normalise la casse, les espaces et les variantes de tiret avant la recherche', async () => {
    let searchedReference = ''

    await executeCadastralSearch('  su – 1178  ', {
      getAuthenticatedUser: async () => ({ id: 'agent-1' }),
      searchTitles: async (reference) => {
        searchedReference = reference
        return { records: [], error: null }
      },
    })

    expect(searchedReference).toBe('SU-1178')
  })

  it('normalise une référence volume et folio avant la recherche', async () => {
    let searchedReference = ''

    await executeCadastralSearch('  vol   ama 171   folio  68 ', {
      getAuthenticatedUser: async () => ({ id: 'agent-1' }),
      searchTitles: async (reference) => {
        searchedReference = reference
        return { records: [], error: null }
      },
    })

    expect(searchedReference).toBe('VOL AMA 171 FOLIO 68')
  })

  it('distingue une absence de session d’une absence de titre', async () => {
    const response = await executeCadastralSearch('1178', {
      getAuthenticatedUser: async () => null,
      searchTitles: async () => ({ records: [], error: null }),
    })

    expect(response).toEqual({
      ok: false,
      code: 'UNAUTHENTICATED',
      message: 'Authentification requise pour interroger le registre.',
    })
  })

  it('classe une panne de base comme erreur technique sans conclure à une fraude', async () => {
    const response = await executeCadastralSearch('1178', {
      getAuthenticatedUser: async () => ({ id: 'agent-1' }),
      searchTitles: async () => ({
        records: null,
        error: new Error('database unavailable'),
      }),
    })

    expect(response).toEqual({
      ok: false,
      code: 'DATABASE_ERROR',
      message: 'La recherche du registre est temporairement indisponible.',
    })

    const outcome = deriveAntiFolioOutcome({
      searchError: response.ok === false,
    })

    expect(outcome.searchState).toBe('technical_error')
    expect(outcome.administrativeStatus).toBeNull()
  })
})
