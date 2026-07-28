'use client'

import React, { useEffect, useState } from 'react'

import {
  getDossierDocumentChecklist,
  listManageableDossiers,
} from '@/app/smart-archive/actions'
import { DossierPieceManager } from '@/components/DossierPieceManager'
import type { DocumentChecklist } from '@/lib/land-files'

type ManageableDossier = {
  id: string
  numeroDossier: string
  statut: string
}

type DossierWorkspaceProps = {
  initialDossier?: {
    dossierId: string
    checklist: DocumentChecklist
  } | null
}

export function DossierWorkspace({
  initialDossier = null,
}: DossierWorkspaceProps) {
  const [dossiers, setDossiers] = useState<ManageableDossier[]>([])
  const [selectedId, setSelectedId] = useState(
    initialDossier?.dossierId || '',
  )
  const [checklist, setChecklist] = useState<DocumentChecklist | null>(
    initialDossier?.checklist || null,
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    void listManageableDossiers().then(result => {
      if (!active) return
      setIsLoading(false)
      if (!result.data) {
        setError(result.error || 'Liste des dossiers indisponible.')
        return
      }
      setDossiers(result.data)
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!initialDossier) return
    setSelectedId(initialDossier.dossierId)
    setChecklist(initialDossier.checklist)
  }, [initialDossier])

  const selectDossier = async (dossierId: string) => {
    setSelectedId(dossierId)
    setChecklist(null)
    setError(null)
    if (!dossierId) return

    setIsLoading(true)
    const result = await getDossierDocumentChecklist(dossierId)
    setIsLoading(false)
    if (!result.data) {
      setError(result.error || 'Checklist documentaire indisponible.')
      return
    }
    setChecklist(result.data)
  }

  return React.createElement(
    'section',
    {
      className:
        'w-full max-w-3xl mb-8 rounded-2xl border border-slate-200 dark:border-brand-border bg-white dark:bg-brand-surface/60 p-5',
    },
    React.createElement(
      'h2',
      { className: 'text-sm font-bold uppercase tracking-wide' },
      'Dossier foncier et pièces',
    ),
    React.createElement(
      'label',
      { className: 'mt-3 block text-xs font-semibold' },
      'Dossier foncier existant',
      React.createElement(
        'select',
        {
          'aria-label': 'Dossier foncier existant',
          value: selectedId,
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
            void selectDossier(event.target.value)
          },
          className: 'mt-1 block w-full rounded-lg border p-2',
        },
        React.createElement(
          'option',
          { value: '' },
          isLoading ? 'Chargement…' : 'Sélectionner un dossier',
        ),
        dossiers.map(dossier =>
          React.createElement(
            'option',
            { key: dossier.id, value: dossier.id },
            `${dossier.numeroDossier} — ${dossier.statut}`,
          ),
        ),
      ),
    ),
    error
      ? React.createElement(
          'p',
          { role: 'alert', className: 'mt-3 text-xs text-red-500' },
          error,
        )
      : null,
    checklist && selectedId
      ? React.createElement(
          React.Fragment,
          null,
          checklist.validationReady
            ? React.createElement(
                'p',
                {
                  className:
                    'mt-3 text-sm font-semibold text-brand-primary',
                },
                'Contrôles documentaires requis pour validation présents.',
              )
            : React.createElement(
                'p',
                {
                  className:
                    'mt-3 text-sm text-amber-700 dark:text-amber-300',
                },
                `Contrôles documentaires requis pour validation manquants : ${checklist.missing.join(', ')}`,
              ),
          React.createElement(DossierPieceManager, {
            key: selectedId,
            dossierId: selectedId,
            initialChecklist: checklist,
            onChecklistChange: setChecklist,
          }),
        )
      : null,
  )
}
