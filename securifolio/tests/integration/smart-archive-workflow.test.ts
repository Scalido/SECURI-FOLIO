import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  rpc: vi.fn(),
  profile: {
    full_name: 'Amina Kabasele',
    role: 'agent',
    matricule: 'MAT-2048',
    fonction: 'Inspectrice cadastrale',
  },
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'agent-1' } } }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        const profileQuery = {
          select: () => profileQuery,
          eq: () => profileQuery,
          single: async () => ({ data: testState.profile, error: null }),
        }
        return profileQuery
      }

      if (table === 'titres_fonciers') {
        const titleQuery = {
          select: () => titleQuery,
          eq: () => titleQuery,
          single: async () => ({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }
        return titleQuery
      }

      if (table === 'smart_archive_history') {
        const historyQuery = {
          select: () => historyQuery,
          eq: () => historyQuery,
          order: () => historyQuery,
          limit: async () => ({ data: [], error: null }),
          insert: async () => ({ error: null }),
        }
        return historyQuery
      }

      throw new Error(`Unexpected table: ${table}`)
    },
    rpc: testState.rpc,
  }),
}))

import { saveCertificate } from '@/app/smart-archive/actions'
import * as validationModule from '@/lib/validations'

const extractedCertificate = {
  nom: 'Mosele Mombanga',
  numero_cadastral: '1178',
  volume: 'AMA 171',
  folio: '68',
  circonscription: 'Gombe',
  superficie: '450',
  date_etablissement: '12 janvier 2026',
  alerte_phenomene_folio: false,
}

describe('workflow Smart-Archive', () => {
  beforeEach(() => {
    testState.rpc.mockReset()
    testState.rpc.mockResolvedValue({ error: null })
    process.env.CERTIFICATE_HMAC_SECRET = 'test-only-secret'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('rejette une requête forgée sans attestation avant toute création', async () => {
    const response = await saveCertificate(extractedCertificate)

    expect(response).toEqual({
      success: false,
      error: 'Attestation obligatoire avant transmission.',
    })
    expect(testState.rpc).not.toHaveBeenCalled()
  })

  it('remplace toute confiance simulée par une consigne de vérification humaine', async () => {
    const random = vi.spyOn(Math, 'random')
    const getExtractionReviewLabel = (
      validationModule as Record<string, unknown>
    ).getExtractionReviewLabel

    expect(typeof getExtractionReviewLabel).toBe('function')
    if (typeof getExtractionReviewLabel !== 'function') return
    expect(getExtractionReviewLabel()).toBe('Extrait par IA — vérification humaine requise')
    expect(random).not.toHaveBeenCalled()
  })

  it('autorise la transmission uniquement après attestation contrôlée', () => {
    const canSubmitArchive = (
      validationModule as Record<string, unknown>
    ).canSubmitArchive

    expect(typeof canSubmitArchive).toBe('function')
    if (typeof canSubmitArchive !== 'function') return
    expect(canSubmitArchive(false, false)).toBe(false)
    expect(canSubmitArchive(true, false)).toBe(true)
    expect(canSubmitArchive(true, true)).toBe(false)
  })
})
