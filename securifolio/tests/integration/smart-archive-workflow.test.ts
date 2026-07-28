import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
import { ExtractionReviewLabel } from '@/components/ExtractionReviewLabel'
import { SmartArchiveAttestationControls } from '@/components/SmartArchiveAttestationControls'
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
    testState.profile.full_name = 'Amina Kabasele'
    testState.profile.matricule = 'MAT-2048'
    testState.profile.fonction = 'Inspectrice cadastrale'
    process.env.CERTIFICATE_HMAC_SECRET = 'test-only-secret'
  })

  afterEach(() => {
    cleanup()
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

  it('rejette côté serveur une transmission avec profil agent incomplet', async () => {
    testState.profile.matricule = ''

    const response = await saveCertificate({
      ...extractedCertificate,
      attested: true,
    })

    expect(response).toEqual({
      success: false,
      error: 'Profil agent incomplet : nom, fonction et matricule sont obligatoires.',
    })
    expect(testState.rpc).not.toHaveBeenCalled()
  })

  it('rend le vrai libellé OCR sans consulter Math.random', () => {
    const random = vi.spyOn(Math, 'random')

    render(React.createElement(ExtractionReviewLabel))

    expect(screen.getByText('Extrait par IA — vérification humaine requise')).toBeInTheDocument()
    expect(random).not.toHaveBeenCalled()
  })

  it('bloque attestation et transmission pendant le chargement ou après erreur profil', () => {
    const onCertifiedChange = vi.fn()
    const onSubmit = vi.fn()
    const props = {
      isCertified: false,
      isSaving: false,
      onCertifiedChange,
      onSubmit,
      onCancel: vi.fn(),
    }

    const { rerender } = render(React.createElement(SmartArchiveAttestationControls, {
      ...props,
      profileState: { status: 'loading' },
    }))

    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /Transmettre pour Validation/i })).toBeDisabled()
    expect(screen.getByText(/Chargement de l’identité/)).toBeInTheDocument()

    rerender(React.createElement(SmartArchiveAttestationControls, {
      ...props,
      profileState: { status: 'error', error: 'Profil agent indisponible.' },
    }))

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: /Transmettre pour Validation/i }))

    expect(screen.getByRole('alert')).toHaveTextContent('Profil agent indisponible.')
    expect(checkbox).toBeDisabled()
    expect(onCertifiedChange).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('autorise la transmission uniquement avec profil complet et attestation contrôlée', () => {
    const props = {
      profileState: {
        status: 'ready' as const,
        profile: {
          full_name: 'Amina Kabasele',
          role: 'agent' as const,
          matricule: 'MAT-2048',
          fonction: 'Inspectrice cadastrale',
        },
      },
      isCertified: false,
      isSaving: false,
      onCertifiedChange: vi.fn(),
      onSubmit: vi.fn(),
      onCancel: vi.fn(),
    }
    const { rerender } = render(
      React.createElement(SmartArchiveAttestationControls, props),
    )

    expect(screen.getByRole('checkbox', { name: /Amina Kabasele/i })).toBeEnabled()
    expect(screen.getByText(/MAT-2048/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Transmettre pour Validation/i })).toBeDisabled()

    rerender(React.createElement(SmartArchiveAttestationControls, {
      ...props,
      isCertified: true,
    }))

    expect(screen.getByRole('button', { name: /Transmettre pour Validation/i })).toBeEnabled()
  })

  it('ne définit aucune version documentaire côté client', () => {
    expect(
      (validationModule as Record<string, unknown>).SMART_ARCHIVE_DOCUMENT_VERSION,
    ).toBeUndefined()
  })
})
