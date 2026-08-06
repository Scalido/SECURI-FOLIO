import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'agent-1' } as { id: string } | null,
  profile: {
    full_name: 'Amina Kabasele',
    role: 'agent',
    matricule: 'MAT-2048',
    fonction: 'Inspectrice cadastrale',
    circonscription: 'Gombe',
  } as Record<string, string>,
  dossiers: [{ id: 'dossier-1', numero_dossier: 'DF-2026-001', statut: 'Brouillon' }],
  filters: [] as Array<[string, string]>,
}))

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      if (table === 'profiles') {
        const profileQuery = {
          select: () => profileQuery,
          eq: () => profileQuery,
          single: async () => ({ data: state.profile, error: null }),
        }
        return profileQuery
      }
      if (table === 'dossiers_fonciers') {
        const dossierQuery = {
          select: () => dossierQuery,
          order: () => dossierQuery,
          limit: () => dossierQuery,
          eq: (field: string, value: string) => {
            state.filters.push([field, value])
            return dossierQuery
          },
          then: (resolve: (value: unknown) => unknown) => resolve({
            data: state.dossiers,
            error: null,
          }),
        }
        return dossierQuery
      }
      throw new Error(`Table inattendue: ${table}`)
    },
  }),
}))

vi.mock('@/utils/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { listManageableDossiers } from '@/app/smart-archive/actions'

describe('liste des dossiers gérables', () => {
  beforeEach(() => {
    state.user = { id: 'agent-1' }
    state.profile = {
      full_name: 'Amina Kabasele', role: 'agent', matricule: 'MAT-2048',
      fonction: 'Inspectrice cadastrale', circonscription: 'Gombe',
    }
    state.filters = []
  })

  it('refuse un non-agent avant la requête des dossiers', async () => {
    state.profile.role = 'citoyen'
    await expect(listManageableDossiers()).resolves.toEqual({
      data: null,
      error: 'Accès refusé. Rôle agent requis.',
    })
    expect(state.filters).toEqual([])
  })

  it('retourne la liste normalisée et limitée à la circonscription de l’agent', async () => {
    await expect(listManageableDossiers()).resolves.toEqual({
      data: [{ id: 'dossier-1', numeroDossier: 'DF-2026-001', statut: 'Brouillon' }],
      error: null,
    })
    expect(state.filters).toEqual([['circonscription', 'Gombe']])
  })
})
