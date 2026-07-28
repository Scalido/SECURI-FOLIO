import React from 'react'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  list: vi.fn(),
  reserve: vi.fn(),
  addPiece: vi.fn(),
  checklist: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/app/smart-archive/actions', () => ({
  listManageableDossiers: state.list,
  reservePrivateStoragePath: state.reserve,
  addDossierPiece: state.addPiece,
  getDossierDocumentChecklist: state.checklist,
}))

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({ upload: state.upload, remove: state.remove }),
    },
  }),
}))

import { DossierWorkspace } from '@/components/DossierWorkspace'
import type { DocumentChecklist } from '@/lib/land-files'

const dossierId = '7d9a93d3-8f28-4c86-99a6-95855e28f062'
const checklistV1: DocumentChecklist = {
  validationReady: false,
  missing: ['croquis'],
  versions: { croquis: 1 },
  cadastre: { ready: false, missing: ['croquis'] },
  conservateur: { ready: true, missing: [] },
}
const checklistV2: DocumentChecklist = {
  ...checklistV1,
  validationReady: true,
  missing: [],
  versions: { croquis: 2 },
  cadastre: { ready: true, missing: [] },
}

describe('espace de travail d’un dossier existant', () => {
  beforeEach(() => {
    Object.values(state).forEach(mock => mock.mockReset())
    state.list.mockResolvedValue({
      data: [{ id: dossierId, numeroDossier: 'DF-2026-001', statut: 'Brouillon' }],
      error: null,
    })
    state.checklist.mockResolvedValueOnce({ data: checklistV1, error: null })
      .mockResolvedValueOnce({ data: checklistV2, error: null })
    state.reserve.mockResolvedValue({
      data: { path: 'documents/agent-1/croquis-v2.pdf' },
      error: null,
    })
    state.upload.mockResolvedValue({ error: null })
    state.remove.mockResolvedValue({ error: null })
    state.addPiece.mockResolvedValue({ success: true, version: 2 })
  })

  afterEach(cleanup)

  it('charge un dossier, puis rattache une nouvelle version via le gestionnaire réel', async () => {
    render(React.createElement(DossierWorkspace))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'DF-2026-001 — Brouillon' }))
        .toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Dossier foncier existant'), {
      target: { value: dossierId },
    })
    await waitFor(() => {
      expect(state.checklist).toHaveBeenCalledWith(dossierId)
      expect(
        screen.getByText('Croquis du terrain : version 1'),
      ).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Type de pièce'), {
      target: { value: 'croquis' },
    })
    fireEvent.change(screen.getByLabelText('Fichier de la pièce'), {
      target: {
        files: [
          new File(
            ['%PDF-1.7 croquis'],
            'croquis.pdf',
            { type: 'application/pdf' },
          ),
        ],
      },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la pièce' }))

    await waitFor(() => {
      expect(state.upload).toHaveBeenCalledWith(
        'documents/agent-1/croquis-v2.pdf',
        expect.any(File),
      )
      expect(state.addPiece).toHaveBeenCalledWith({
        dossierId,
        typePiece: 'croquis',
        storagePath: 'documents/agent-1/croquis-v2.pdf',
      })
      expect(screen.getByRole('status')).toHaveTextContent(
        'Croquis du terrain enregistré — version 2.',
      )
      expect(
        screen.getByText('Croquis du terrain : version 2'),
      ).toBeInTheDocument()
    })
    expect(state.checklist).toHaveBeenCalledTimes(2)
  })
})
