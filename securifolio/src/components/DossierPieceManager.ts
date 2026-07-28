'use client'

import React, { useState } from 'react'

import {
  addDossierPiece,
  getDossierDocumentChecklist,
  reservePrivateStoragePath,
} from '@/app/smart-archive/actions'
import {
  LAND_FILE_PIECE_TYPES,
  type DocumentChecklist,
  type LandFilePieceType,
} from '@/lib/land-files'
import { withDefinitiveUploadObject } from '@/lib/documents/temporary-analysis'
import { createClient } from '@/utils/supabase/client'

type DossierPieceManagerProps = {
  dossierId: string
  initialChecklist: DocumentChecklist
  onChecklistChange?: (checklist: DocumentChecklist) => void
}

export function DossierPieceManager({
  dossierId,
  initialChecklist,
  onChecklistChange,
}: DossierPieceManagerProps) {
  const [typePiece, setTypePiece] = useState<LandFilePieceType>(
    'pv_mesurage_bornage',
  )
  const [file, setFile] = useState<File | null>(null)
  const [checklist, setChecklist] = useState(initialChecklist)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitPiece = async () => {
    if (!file) {
      setError('Sélectionnez un fichier.')
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const extension = file.name.split('.').pop() || 'bin'
      const reserved = await reservePrivateStoragePath('documents', extension)
      if (!reserved.data) {
        setError(reserved.error || 'Réservation du stockage impossible.')
        return
      }

      const storagePath = reserved.data.path
      const bucket = createClient().storage.from('scans_certificats')
      const result = await withDefinitiveUploadObject({
        upload: async () => {
          const { error: uploadError } = await bucket.upload(storagePath, file)
          if (uploadError) throw new Error(uploadError.message)
        },
        operation: () => addDossierPiece({
          dossierId,
          typePiece,
          storagePath,
        }),
        cleanup: async () => {
          const { error: cleanupError } = await bucket.remove([storagePath])
          if (
            cleanupError
            && !/not found|does not exist/i.test(cleanupError.message)
          ) {
            throw new Error(cleanupError.message)
          }
        },
      })

      if (!result.success || !('version' in result)) {
        setError(result.error || 'Ajout de la pièce impossible.')
        return
      }

      const refreshed = await getDossierDocumentChecklist(dossierId)
      if (!refreshed.data) {
        setError(
          refreshed.error
          || 'Pièce ajoutée, mais checklist indisponible.',
        )
        return
      }

      setChecklist(refreshed.data)
      onChecklistChange?.(refreshed.data)
      setMessage(`${typePiece} enregistrée — version ${result.version}.`)
      setFile(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Ajout de la pièce impossible.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return React.createElement(
    'section',
    {
      className:
        'mt-5 border-t border-slate-200 dark:border-brand-border pt-5',
    },
    React.createElement(
      'h3',
      { className: 'text-sm font-bold' },
      'Ajouter ou remplacer une pièce',
    ),
    React.createElement(
      'div',
      { className: 'mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]' },
      React.createElement(
        'label',
        { className: 'text-xs font-semibold' },
        'Type de pièce',
        React.createElement(
          'select',
          {
            'aria-label': 'Type de pièce',
            value: typePiece,
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
              setTypePiece(event.target.value as LandFilePieceType)
            },
            className: 'mt-1 block w-full rounded-lg border p-2',
          },
          LAND_FILE_PIECE_TYPES.map(type =>
            React.createElement('option', { key: type, value: type }, type),
          ),
        ),
      ),
      React.createElement(
        'label',
        { className: 'text-xs font-semibold' },
        'Fichier privé',
        React.createElement('input', {
          'aria-label': 'Fichier de la pièce',
          type: 'file',
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
            setFile(event.target.files?.[0] || null)
          },
          className: 'mt-1 block w-full text-xs',
        }),
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          disabled: isSaving,
          onClick: submitPiece,
          className:
            'self-end rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold text-brand-bg disabled:opacity-50',
        },
        isSaving ? 'Enregistrement…' : 'Enregistrer la pièce',
      ),
    ),
    error
      ? React.createElement(
          'p',
          { role: 'alert', className: 'mt-3 text-xs text-red-500' },
          error,
        )
      : null,
    message
      ? React.createElement(
          'p',
          { role: 'status', className: 'mt-3 text-xs text-brand-primary' },
          message,
        )
      : null,
    React.createElement(
      'div',
      { className: 'mt-4' },
      React.createElement(
        'p',
        { className: 'text-xs font-bold' },
        'Versions actuelles',
      ),
      Object.keys(checklist.versions).length === 0
        ? React.createElement(
            'p',
            { className: 'text-xs text-slate-500' },
            'Aucune pièce versionnée.',
          )
        : React.createElement(
            'ul',
            { className: 'mt-1 text-xs text-slate-600 dark:text-slate-300' },
            Object.entries(checklist.versions).map(([type, version]) =>
              React.createElement(
                'li',
                { key: type },
                `${type} : version ${version}`,
              ),
            ),
          ),
    ),
  )
}
