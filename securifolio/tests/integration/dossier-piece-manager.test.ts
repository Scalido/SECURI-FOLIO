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
  reserve: vi.fn(),
  addPiece: vi.fn(),
  refresh: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/app/smart-archive/actions', () => ({
  reservePrivateStoragePath: state.reserve,
  addDossierPiece: state.addPiece,
  getDossierDocumentChecklist: state.refresh,
}))

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: state.upload,
        remove: state.remove,
      }),
    },
  }),
}))

import { DossierPieceManager } from '@/components/DossierPieceManager'
import type { DocumentChecklist } from '@/lib/land-files'

const dossierId = '7d9a93d3-8f28-4c86-99a6-95855e28f062'
const initialChecklist: DocumentChecklist = {
  complete: false,
  missing: [
    'pv_mesurage_bornage',
    'croquis',
    'minute_certificat',
    'preuve_paiement',
  ],
  versions: { croquis: 1 },
  cadastre: {
    ready: false,
    missing: ['pv_mesurage_bornage', 'croquis'],
  },
  conservateur: {
    ready: false,
    missing: ['minute_certificat', 'preuve_paiement'],
  },
}

describe('gestion des pièces du dossier', () => {
  afterEach(cleanup)

  beforeEach(() => {
    state.reserve.mockReset()
    state.addPiece.mockReset()
    state.refresh.mockReset()
    state.upload.mockReset()
    state.remove.mockReset()

    state.reserve.mockResolvedValue({
      data: { path: 'documents/agent-1/croquis-v2.pdf' },
      error: null,
    })
    state.upload.mockResolvedValue({ error: null })
    state.remove.mockResolvedValue({ error: null })
    state.addPiece.mockResolvedValue({ success: true, version: 2 })
    state.refresh.mockResolvedValue({
      data: {
        ...initialChecklist,
        versions: { croquis: 2 },
      },
      error: null,
    })
  })

  it('téléverse un remplacement privé et affiche la version serveur', async () => {
    const onChecklistChange = vi.fn()
    render(React.createElement(DossierPieceManager, {
      dossierId,
      initialChecklist,
      onChecklistChange,
    }))

    fireEvent.change(screen.getByLabelText('Type de pièce'), {
      target: { value: 'croquis' },
    })
    fireEvent.change(screen.getByLabelText('Fichier de la pièce'), {
      target: {
        files: [new File(['croquis'], 'croquis.pdf', {
          type: 'application/pdf',
        })],
      },
    })
    fireEvent.click(screen.getByRole('button', {
      name: 'Enregistrer la pièce',
    }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'croquis enregistrée — version 2.',
      )
    })
    expect(state.upload).toHaveBeenCalledWith(
      'documents/agent-1/croquis-v2.pdf',
      expect.any(File),
    )
    expect(state.addPiece).toHaveBeenCalledWith({
      dossierId,
      typePiece: 'croquis',
      storagePath: 'documents/agent-1/croquis-v2.pdf',
    })
    expect(state.refresh).toHaveBeenCalledWith(dossierId)
    expect(screen.getByText('croquis : version 2')).toBeInTheDocument()
    expect(onChecklistChange).toHaveBeenCalled()
    expect(state.remove).not.toHaveBeenCalled()
  })

  it('nettoie l’objet privé si le transport de l’action est interrompu', async () => {
    state.addPiece.mockRejectedValue(new Error('transport interrompu'))

    render(React.createElement(DossierPieceManager, {
      dossierId,
      initialChecklist,
    }))
    fireEvent.change(screen.getByLabelText('Fichier de la pièce'), {
      target: {
        files: [new File(['pv'], 'pv.pdf', {
          type: 'application/pdf',
        })],
      },
    })
    fireEvent.click(screen.getByRole('button', {
      name: 'Enregistrer la pièce',
    }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'transport interrompu',
      )
    })
    expect(state.remove).toHaveBeenCalledWith([
      'documents/agent-1/croquis-v2.pdf',
    ])
  })
})
